from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from .models import Post, Collection, UserSlug
from .forms import CreatePostForm


# Create your views here.
# Post Views
def index(request):
    """
    Renders the index page, displaying all posts.

    :param request: (HttpRequest): The HTTP request object.

    :return: HttpResponse: The rendered index.html template with the post_list context variable.
    """
    posts = Post.objects.all().order_by('-time_posted')
    paginator = Paginator(posts, 16)

    post_list = paginator.get_page(1)
    return render(request, 'posts/index.html', {
        "post_list": post_list
    })


def post_list(request, posts):
    paginator = Paginator(posts, 16)

    page_number = request.GET.get("page")
    post_list = paginator.get_page(page_number)
    return render(request, 'posts/post_list.html', {
        "post_list": post_list,
    })


def post_list_index(request):
    posts = Post.objects.all()
    return post_list(request, posts)


def post_list_user(request, user_id):
    posts = Post.objects.filter(author_id=user_id)
    return post_list(request, posts)


def post_list_collection(request, slug):
    posts = Collection.objects.get(slug=slug).posts.all()
    return post_list(request, posts)


def create_post(request):
    # @TODO: add error handling
    """
    Creates a new post.

    If the request is a POST, validates the input and creates a new Post
    with the given text and author. If the request is a GET, renders a
    form to create a post.

    :param request: (HttpRequest): The HTTP request object.
    :return: A JSON response with the status 200 if the post is created
        successfully, or a HTML page with the form to create a post if the
        request is a GET request.
    """
    if request.method == "POST":
        create_post_form = CreatePostForm(data=request.POST)
        if create_post_form.is_valid():
            new_post = create_post_form.save(commit=False)
            new_post.author = request.user
            new_post.save()
            # @TODO: change this to behave differently depending on whether
            # the user is already on the posts page or on another page
            return HttpResponse(status=200)
    else:
        create_post_form = CreatePostForm()
        return render(request, 'posts/create_post_form.html', {
            "create_post_form": create_post_form,
        })


def edit_post(request, post_id):
    post = Post.objects.get(id=post_id)
    if request.method == "POST":
        text = dict(request.POST)["text"][0]
        if request.user == post.author:
            post.text = text
            try:
                post.save()
                return HttpResponse(status=200)
            except Exception as e:
                return HttpResponse(status=500)
    else:
        create_post_form = CreatePostForm({"text": post.text})
        return render(request, 'posts/create_post_form.html', {
            "create_post_form": create_post_form,
        })


def delete_post(request, post_id):
    """
    Deletes a post for the current user.

    :param request: A POST request or a GET request.
    :param post_id: The id of the post to delete.
    :return: A JSON response with the status 200 if the post is deleted correctly, or a HTML page with the post
             to be deleted if the request is a GET request.
    """
    post = get_object_or_404(Post, pk=post_id)

    if post.author == request.user:
        if request.method == "POST":
            post.delete()
            return HttpResponse(status=200)
        else:
            return render(request, 'posts/delete_post_form.html', {
                "post": post
            })


# Collection Views
def collections(request):
    """
    Renders a page with a list of all collections.

    :param request: The HTTP request object.
    :return: A rendered HTML page with the list of collections.
    """
    all_collections = Collection.objects.all().order_by('-updated_on')
    paginator = Paginator(all_collections, 16)
    collections = paginator.get_page(1)

    return render(request, 'posts/collections.html', {
        "collections": collections
    })


def collection_list(request, collections):
    paginator = Paginator(collections, 16)

    page_number = request.GET.get("page")
    col_list = paginator.get_page(page_number)
    return render(request, 'posts/collection_list.html', {
        "collections": col_list,
    })


def collection_list_all(request):
    collections = Collection.objects.all()
    return collection_list(request, collections)


def collection_list_user(request, user_id):
    collections = Collection.objects.filter(author_id=user_id)
    return collection_list(request, collections)


def individual_collection(request, slug):
    """
    Renders a single collection and all its posts.

    :param request: The HTTP request object.
    :param slug: The slug of the collection to be rendered.
    :return: A rendered HTML page with the collection and its posts.
    """
    collection = get_object_or_404(Collection, slug=slug)
    posts = collection.posts.all()
    return render(request, 'posts/single_collection.html', {
        "collection": collection,
        "post_list": posts,
    })


def collection_menu(request, post_id):
    """
    Adds or removes a post from the user's collections.

    The POST request must contain a parameter 'collection' with a list of collection IDs.
    The method will remove the post from all collections that the user is a part of,
    and add the post to the collections in the list.

    If the request is a GET request, return a JSON response with a list of dictionaries,
    each dictionary containing the name and id of a collection, and a boolean value
    indicating if the post is already in the collection. This is then used by JS
    on the client side to generate a checkbox menu with the available collections.

    :param request: A POST request with a 'collection' parameter, or a GET request.
    :param post_id: The id of the post to add or remove from collections.
    :return: For GET: A JsonResponse with the list of available collections.
    For POST: An HttpResponse with the status 200 after the post is added.
    """
    if request.method == 'POST':
        post = get_object_or_404(Post, pk=post_id)
        for collection in request.user.collections.all():
            collection.posts.remove(post)
        collections = dict(request.POST)["collection"]
        if collections[0] != 'empty':
            for id in collections:
                collection = get_object_or_404(Collection, pk=id)
                if request.user == collection.author:
                    post.collections.add(collection)
        return HttpResponse(status=200)
    else:
        collections = request.user.collections.all().order_by('name')
        response = [{"name": collection.name, "id": collection.id,
                    "checked": collection.posts.filter(id=post_id).count() > 0} for collection in collections]
        return JsonResponse({"response": response})


def create_collection(request):
    """
    Creates a new collection for the current user.

    :param request: A POST request with a 'name' parameter for the new collection.
    :return: A JSON response with the name and id of the new collection.
    :raises: HttpResponse or JsonResponse with status 500 if there is an error, or if the collection already exists.
    """
    name = dict(request.POST)["name"][0]
    try:
        collection = request.user.collections.create(name=name)
    except Exception as e:
        s = str(e)
        if "duplicate key value" in s:
            return JsonResponse({"text": f"Cannot create collection with name {name}\nCollection already exists"}, status=500)
        return HttpResponse(status=500)
    # @TODO: Handle errors
    return JsonResponse({"name": collection.name, "id": collection.id})


def delete_collection(request, collection_id):
    """
    Deletes a collection for the current user.

    :param request: A POST request or a GET request.
    :param collection_id: The id of the collection to delete.
    :return: A JSON response with the status 200 if the collection is deleted correctly, or a HTML page with the collection
             to be deleted if the request is a GET request.
    """
    collection = get_object_or_404(Collection, pk=collection_id)

    if collection.author == request.user:
        if request.method == "POST":
            collection.delete()
            return HttpResponse(status=200)
        else:
            return render(request, 'posts/delete_collection_form.html', {
                "collection": collection
            })


def edit_collection(request, id):
    name = dict(request.POST)["name"][0]
    collection = Collection.objects.get(id=id)
    try:
        collection.name = name
        collection.save()
        return HttpResponse(status=200)
    except Exception as e:
        s = str(e)
        if "duplicate key value" in s:
            return JsonResponse({"text": f"Cannot rename collection to {name}\nCollection already exists"}, status=500)
        return HttpResponse(status=500)

# User Views


def user(request, user_id):
    """
    Shows a user's profile page with their posts and collections.

    :param request: The request object.
    :param user_id: The id of the user whose profile is shown.
    :return: A rendered HTML page with the user's data.
    """
    displayed_user = User.objects.get(id=user_id)

    # all_posts = displayed_user.posts.all().order_by('-time_posted')
    # posts_paginator = Paginator(all_posts, 16)
    # posts = posts_paginator.get_page(1)

    # all_collections = displayed_user.collections.all().order_by('-updated_on')
    # collections_paginator = Paginator(all_collections, 16)
    # collections = collections_paginator.get_page(1)

    return render(request, 'posts/user.html', {
        "displayed_user": displayed_user,
        # "post_list": posts,
        # "collections": collections,
    })
