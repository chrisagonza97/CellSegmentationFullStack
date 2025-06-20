from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .segmentations import predict_single_image_unet, return_negative_img
from django.http import HttpResponse
from io import BytesIO
import traceback
import json
import base64

@api_view(['GET'])
def hello_world(request):
    return Response({"message": "Hello from Django!"})

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def segment_image(request):
    if 'image' not in request.FILES:
        return Response({'error': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)
    if 'mask' not in request.FILES:
        return Response({'error': 'No ground truth mask provided.'}, status=status.HTTP_400_BAD_REQUEST)

    image = request.FILES['image']
    mask = request.FILES['mask']

    image_path = default_storage.save(f"uploads/{image.name}", ContentFile(image.read()))
    mask_path = default_storage.save(f"uploads/{mask.name}", ContentFile(mask.read()))

    full_image_path = os.path.join(default_storage.location, image_path)
    full_mask_path = os.path.join(default_storage.location, mask_path)

    try:
        pil_mask_image, metrics = predict_single_image_unet(full_image_path, full_mask_path)

        buffer = BytesIO()
        pil_mask_image.save(buffer, format="PNG")
        buffer.seek(0)

        # Encode image to base64
        base64_img = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return Response({
            "image": base64_img,
            "metrics": metrics
        })

    except Exception as e:
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)