from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .segmentations import predict_single_image_unet, return_negative_img, predict_single_image_transunet
from django.http import HttpResponse
from io import BytesIO
import traceback
import json
import base64
import tempfile
import shutil

@api_view(['GET'])
def hello_world(request):
    return Response({"message": "Hello from Django!"})

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def segment_image(request):
    if 'image' not in request.FILES or 'mask' not in request.FILES:
        return Response({'error': 'Image and mask files are required.'}, status=status.HTTP_400_BAD_REQUEST)

    image = request.FILES['image']
    mask = request.FILES['mask']

    image_path = default_storage.save(f"uploads/{image.name}", ContentFile(image.read()))
    mask_path = default_storage.save(f"uploads/{mask.name}", ContentFile(mask.read()))

    full_image_path = os.path.join(default_storage.location, image_path)
    full_mask_path = os.path.join(default_storage.location, mask_path)

    try:
        pil_unet, metrics_unet = predict_single_image_unet(
            full_image_path, full_mask_path, model_key="unet"
        )
        pil_transunet, metrics_transunet = predict_single_image_transunet(
            full_image_path, full_mask_path, model_key="transunet"
        )

        def to_base64(pil_img):
            buf = BytesIO()
            pil_img.save(buf, format="PNG")
            return base64.b64encode(buf.getvalue()).decode("utf-8")

        response = Response({
            "unet": {
                "image": to_base64(pil_unet),
                "metrics": metrics_unet
            },
            "transunet": {
                "image": to_base64(pil_transunet),
                "metrics": metrics_transunet
            }
        })

    except Exception as e:
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)
    
    finally:
        # Clean up the uploaded files
        try:
            if default_storage.exists(image_path):
                default_storage.delete(image_path)
            if default_storage.exists(mask_path):
                default_storage.delete(mask_path)
        except Exception as cleanup_error:
            # Log cleanup errors but don't fail the request
            print(f"Error during cleanup: {cleanup_error}")
    
    return response