from django.urls import path, include
from .views import index, create_post, delete_post, collections, individual_collection, collection_menu, create_collection, user, delete_collection, edit_collection, edit_post, post_list_index, post_list_user, post_list_collection, collection_list_all, collection_list_user, follow_user

urlpatterns = [
    path('', include(
        [
            path('', index, name="index"),
            path('post-list', post_list_index, name="post-list-index"),
        ]
    )),
    path('create-post', create_post, name="create-post"),
    path('edit-post/<int:post_id>', edit_post, name="edit-post"),
    path('delete-post/<int:post_id>', delete_post, name="delete-post"),
    path('collections/', include(
        [
            path('', collections, name="collections"),
            path('collection-list', collection_list_all,
                 name="collection-list-all")
        ]
    )),
    path('collections/<slug:slug>/', include(
        [
            path('', individual_collection, name="individual-collection"),
            path('post-list', post_list_collection,
                 name="post-list-collection"),
        ]
    )),
    path('collection-menu/<int:post_id>', collection_menu,
         name="collection-menu"),
    path('create-collection', create_collection, name="create-collection"),
    path('delete-collection/<int:collection_id>',
         delete_collection, name="delete-collection"),
    path('edit-collection/<int:id>',
         edit_collection, name="edit-collection"),
    path('user/<int:user_id>/', include(
        [
            path('', user, name="user-profile"),
            path('post-list', post_list_user, name="post-list-user"),
            path('collection-list', collection_list_user,
                 name="collection-list-user")
        ]
    )),
    path('follow/', follow_user, name="follow-user"),
]
