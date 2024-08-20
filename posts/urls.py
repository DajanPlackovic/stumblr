from django.urls import path
from .views import index, create_post, delete_post, collection_list, individual_collection, collection_menu, create_collection, user

urlpatterns = [
    path('', index, name="index"),
    path('create-post', create_post, name="create-post"),
    path('delete-post/<int:post_id>', delete_post, name="delete-post"),
    path('collections/', collection_list, name="collection-list"),
    path('collections/<slug:slug>', individual_collection,
         name="individual-collection"),
    path('collection-menu/<int:post_id>', collection_menu,
         name="collection-menu"),
    path('create-collection', create_collection, name="create-collection"),
    path('user/<int:user_id>', user, name="user-profile"),
]
