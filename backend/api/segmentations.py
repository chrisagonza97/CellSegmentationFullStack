from torchvision import transforms
from PIL import Image
import torch
import segmentation_models_pytorch as smp
import numpy as np
import os
import glob
from PIL import Image, ImageOps
import io
from django.conf import settings
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import label_binarize
from .transunet import TransUNet
import gc

def predict_single_image_unet(img_path, mask_path, model=None, model_key="unet", encoder_name="resnet18", path_dir="api/seg_models", device="cpu"):
    # Load and preprocess image
    preprocess = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
    ])
    image = Image.open(img_path).convert("RGB")
    input_tensor = preprocess(image).unsqueeze(0)

    # Load model
    encoder_name = "resnet18" if encoder_name not in smp.encoders.get_encoder_names() else encoder_name
    if model is None:
        model_class = dict(unet=smp.Unet, fpn=smp.FPN).get(model_key, smp.Unet)
        model = model_class(classes=3, in_channels=3, encoder_name=encoder_name, encoder_weights=None)
        model_path = os.path.join(path_dir, "bestunet_model.pkl")
        model.load_state_dict(torch.load(model_path, map_location=device))
        print(f"Loaded model from {model_path}")

    model = model.to(device)
    model.eval()

    # Run prediction
    with torch.no_grad():
        input_tensor = input_tensor.to(device)
        output = torch.softmax(model(input_tensor), dim=1)
        prediction = output.squeeze(0).cpu().numpy()

    predicted_labels = prediction.argmax(axis=0).astype(np.uint8)

    del model
    gc.collect()

    colormap = np.array([
        [0, 0, 0],
        [0, 255, 0],
        [255, 0, 0],
    ], dtype=np.uint8)
    rgb_image = colormap[predicted_labels]

    metrics = {}
    if mask_path:
        true_mask = Image.open(mask_path).resize((256, 256), resample=Image.NEAREST)
        true_labels = np.array(true_mask).astype(np.uint8)

        flat_pred = predicted_labels.flatten()
        flat_true = true_labels.flatten()

        report = classification_report(flat_true, flat_pred, output_dict=True, zero_division=0)

        y_true_bin = label_binarize(flat_true, classes=[0, 1, 2])
        y_pred_flat = prediction.transpose(1, 2, 0).reshape(-1, 3)
        try:
            auroc = roc_auc_score(y_true_bin, y_pred_flat, multi_class='ovr')
        except ValueError:
            auroc = None

        metrics = {
            "classification_report": report,
            "auroc": auroc
        }

    return Image.fromarray(rgb_image), metrics

def predict_single_image_transunet(img_path, mask_path, model=None, model_key="unet", encoder_name="resnet18", path_dir="api/seg_models", device="cpu"):
    # Load and preprocess image
    preprocess = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
    ])
    image = Image.open(img_path).convert("RGB")
    input_tensor = preprocess(image).unsqueeze(0)

    # Load model
    model = TransUNet(in_channels=3, classes=3)
    model_path = os.path.join(path_dir, "best_transunet_model.pkl")
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()


    # Run prediction
    with torch.no_grad():
        input_tensor = input_tensor.to(device)
        output = torch.softmax(model(input_tensor), dim=1)
        prediction = output.squeeze(0).cpu().numpy()

    predicted_labels = prediction.argmax(axis=0).astype(np.uint8)

    del model
    gc.collect()

    colormap = np.array([
        [0, 0, 0],
        [0, 255, 0],
        [255, 0, 0],
    ], dtype=np.uint8)
    rgb_image = colormap[predicted_labels]

    metrics = {}
    if mask_path:
        true_mask = Image.open(mask_path).resize((256, 256), resample=Image.NEAREST)
        true_labels = np.array(true_mask).astype(np.uint8)

        flat_pred = predicted_labels.flatten()
        flat_true = true_labels.flatten()

        report = classification_report(flat_true, flat_pred, output_dict=True, zero_division=0)

        y_true_bin = label_binarize(flat_true, classes=[0, 1, 2])
        y_pred_flat = prediction.transpose(1, 2, 0).reshape(-1, 3)
        try:
            auroc = roc_auc_score(y_true_bin, y_pred_flat, multi_class='ovr')
        except ValueError:
            auroc = None

        metrics = {
            "classification_report": report,
            "auroc": auroc
        }

    return Image.fromarray(rgb_image), metrics

def return_negative_img(img_path):
    image = Image.open(img_path).convert('RGB')
    inverted_image = ImageOps.invert(image)

    buffer = io.BytesIO()
    inverted_image.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer