from django.urls import path
from .views import hello_world, segment_image

urlpatterns = [
    path('hello/', hello_world),
    path('segment/', segment_image),
]