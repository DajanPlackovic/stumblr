from django.urls import path
from .views import index, create_post, delete_post, view_collections

urlpatterns = [
    path('', index, name="index"),
    path('create-post', create_post, name="create-post"),
    path('delete-post/<int:post_id>', delete_post, name="delete-post"),
    path('collections', view_collections, name="collection-list")
]
