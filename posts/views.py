from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from .models import Post, Collection, Following
from .forms import CreatePostForm


def check_theme(request):
    """
    Checks if the user has set a dark theme preference and returns it.

    Returns:
        bool: True if the user prefers a dark theme, False otherwise.
    """
    if "dark_theme" in request.session:
        return request.session["dark_theme"]
    else:
        return False


def set_theme(request):
    """
    Toggle the user's dark theme preference and return a 200 status code.

    Returns:
        HttpResponse: A 200 status code indicating the theme preference was successfully toggled.
    """
    if "dark_theme" in request.session:
        request.session["dark_theme"] = not request.session["dark_theme"]
    else:
        request.session["dark_theme"] = True
    return HttpResponse(status=200)


def success(text='Success'):
    """
    Return a JSON response with a status code of 200 and a key "text" containing the provided text.

    Args:
        text (str): The text to be returned in the JSON response. Defaults to 'Success'.

    Returns:
        JsonResponse: A JSON response with a status code of 200 and a key "text" containing the provided text.
    """
    return JsonResponse({"text": text}, status=200)


def error(text='An error has occurred'):
    """
    Return a JSON response with a status code of 500 and a key "text" containing the provided text.

    Args:
        text (str): The text to be returned in the JSON response. Defaults to 'An error has occurred'.

    Returns:
        JsonResponse: A JSON response with a status code of 500 and a key "text" containing the provided text.
    """

    return JsonResponse({"text": text}, status=500)


# Create your views here.
# Post Views
def index(request):
    """
    Renders the index page, displaying all posts.

    :param request: (HttpRequest): The HTTP request object.

    :return: HttpResponse: The rendered index.html template with
    the post_list context variable.
    """
    posts = Post.objects.all().order_by('-time_posted')
    paginator = Paginator(posts, 16)

    post_list = paginator.get_page(1)
    return render(request, 'posts/index.html', {
        "post_list": post_list,
        "dark_theme": check_theme(request),
    })


def post_list(request, posts):
    """
    Renders the post_list page, displaying a list of posts.

    :param request: (HttpRequest): The HTTP request object.
    :param posts: (QuerySet): The QuerySet of posts to be rendered.

    :return: HttpResponse: The rendered post_list.html template with
    the post_list context variable.
    """
    paginator = Paginator(posts, 16)

    page_number = request.GET.get("page")
    post_list = paginator.get_page(page_number)
    return render(request, 'posts/post_list.html', {
        "post_list": post_list,
        "dark_theme": check_theme(request),
    })


def post_list_index(request):
    """
    Renders the post_list page with all posts.

    :param request: The HTTP request object.
    :return: HttpResponse: The rendered post_list.html template with
    the post_list context variable.
    """
    posts = Post.objects.all()
    return post_list(request, posts)


def post_list_user(request, user_id):
    """
    Renders the post_list page with posts from a specific user.

    :param request: The HTTP request object.
    :param user_id: The id of the user whose posts are to be rendered.
    :return: HttpResponse: The rendered post_list.html template with
    the post_list context variable.
    """
    posts = Post.objects.filter(author_id=user_id)
    return post_list(request, posts)


def post_list_collection(request, slug):
    """
    Renders the post_list page with posts from a specific collection.

    :param request: The HTTP request object.
    :param slug: The slug of the collection whose posts are to be rendered.
    :return: HttpResponse: The rendered post_list.html template with
    the post_list context variable.
    """
    posts = Collection.objects.get(slug=slug).posts.all()
    return post_list(request, posts)


def create_post(request):
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
            return JsonResponse(
                {
                    "fill": {
                        "text": new_post.text,
                        "author_url": "",
                        "author_username": new_post.author.username,
                        "time_posted": new_post.time_posted.strftime("%d/%m/%Y %H:%M"),
                        "post_id": new_post.id,
                    },
                    "condition": {
                        "authenticated": request.user.is_authenticated,
                        "actionable": new_post.author == request.user,
                    }
                }
            )
    else:
        create_post_form = CreatePostForm()
        return render(request, 'posts/create_post_form.html', {
            "create_post_form": create_post_form,
            "dark_theme": check_theme(request),
        })


def edit_post(request, post_id):
    """
    Edits a post.

    If the request is a POST, validates the input and updates the text of
    the post with the given id. If the request is a GET, renders a form to
    edit the post.

    :param request: (HttpRequest): The HTTP request object.
    :param post_id: The id of the post to edit.
    :return: A JSON response with the status 200 if the post is edited
        successfully, or a HTML page with the form to edit the post if the
        request is a GET request.
    """
    post = Post.objects.get(id=post_id)
    if request.method == "POST":
        text = dict(request.POST)["text"][0]
        if request.user == post.author:
            post.text = text
            try:
                post.save()
                return JsonResponse({"text": post.text})
            except Exception as e:
                return error("Failed to edit the post")
    else:
        create_post_form = CreatePostForm({"text": post.text})
        return render(request, 'posts/create_post_form.html', {
            "create_post_form": create_post_form,
            "dark_theme": check_theme(request),
        })


def delete_post(request, post_id):
    """
    Deletes a post for the current user.

    :param request: A POST request or a GET request.
    :param post_id: The id of the post to delete.
    :return: A JSON response with the status 200 if the post is deleted
             correctly, or a HTML page with the post
             to be deleted if the request is a GET request.
    """
    post = get_object_or_404(Post, pk=post_id)

    if post.author == request.user:
        if request.method == "POST":
            post.delete()
            return success("Successfully deleted the post")
        else:
            return JsonResponse(
                {
                    "fill": {
                        "text": post.text,
                        "author_url": "",
                        "author_username": post.author.username,
                        "time_posted": post.time_posted.strftime("%d/%m/%Y %H:%M"),
                    },
                    "condition": {
                        "authenticated": request.user.is_authenticated,
                        "actionable": post.author == request.user,
                    }
                }
            )


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
        "collections": collections,
        "dark_theme": check_theme(request),
    })


def collection_list(request, collections):
    """
    Renders a page with a list of collections.

    :param request: The HTTP request object.
    :param collections: The QuerySet of collections to be rendered.
    :return: A rendered HTML page with the list of collections.
    """
    paginator = Paginator(collections, 16)

    page_number = request.GET.get("page")
    col_list = paginator.get_page(page_number)
    return render(request, 'posts/collection_list.html', {
        "collections": col_list,
        "dark_theme": check_theme(request),
    })


def collection_list_all(request):
    """
    Renders a page with a list of all collections.

    :param request: The HTTP request object.
    :return: A rendered HTML page with the list of collections.
    """

    collections = Collection.objects.all().order_by('-updated_on')
    return collection_list(request, collections)


def collection_list_user(request, user_id):
    """
    Renders a page with a list of collections from a specific user.

    :param request: The HTTP request object.
    :param user_id: The id of the user whose collections are to be rendered.
    :return: A rendered HTML page with the list of collections.
    """
    collections = Collection.objects.filter(
        author_id=user_id).order_by('-updated_on')
    return collection_list(request, collections)


def individual_collection(request, slug):
    """
    Renders a single collection and all its posts.

    :param request: The HTTP request object.
    :param slug: The slug of the collection to be rendered.
    :return: A rendered HTML page with the collection and its posts.
    """
    collection = get_object_or_404(Collection, slug=slug)
    posts = collection.posts.all().order_by('-time_posted')
    return render(request, 'posts/single_collection.html', {
        "collection": collection,
        "post_list": posts,
        "dark_theme": check_theme(request),
    })


def collection_menu(request, post_id):
    """
    Adds or removes a post from the user's collections.

    The POST request must contain a parameter 'collection' with a list of
    collection IDs. The method will remove the post from all collections that
    the user is a part of, and add the post to the collections in the list.

    If the request is a GET request, return a JSON response with a list of
    dictionaries, each dictionary containing the name and id of a collection,
    and a boolean value indicating if the post is already in the collection.
    This is then used by JS on the client side to generate a checkbox menu
    with the available collections.

    :param request: A POST request with a 'collection' parameter, or
        a GET request.
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
        return success("")
    else:
        collections = request.user.collections.all().order_by('name')
        response = [{"name": collection.name, "id": collection.id,
                    "checked": collection.posts.filter(id=post_id).count() > 0} for collection in collections]
        return JsonResponse({"response": response})


def create_collection(request):
    """
    Creates a new collection for the current user.

    :param request: A POST request with a 'name' parameter for
        the new collection.
    :return: A JSON response with the name and id of the new collection.
    :raises: HttpResponse or JsonResponse with status 500 if there is an error,
    or if the collection already exists.
    """
    name = dict(request.POST)["name"][0]
    try:
        collection = request.user.collections.create(name=name)
    except Exception as e:
        s = str(e)
        if "duplicate key value" in s:
            errorText = f"Cannot create collection with name {name}\n"
            errorText += "Collection already exists"
            return error(errorText)
        return error()
    # @TODO: Handle errors
    return JsonResponse({"name": collection.name, "id": collection.id})


def delete_collection(request, collection_id):
    """
    Deletes a collection for the current user.

    :param request: A POST request or a GET request.
    :param collection_id: The id of the collection to delete.
    :return: A JSON response with the status 200 if the collection is deleted
             correctly, or a HTML page with the collection
             to be deleted if the request is a GET request.
    """
    collection = get_object_or_404(Collection, pk=collection_id)

    if collection.author == request.user:
        if request.method == "POST":
            collection.delete()
            return HttpResponse(status=200)
        else:
            return render(request, 'posts/delete_collection_form.html', {
                "collection": collection,
                "dark_theme": check_theme(request),
            })


def edit_collection(request, id):
    """
    Edits a collection.

    If the request is a POST, validates the input and updates the name of
    the collection with the given id. If the request is a GET, renders a form
    to edit the collection.

    :param request: A POST request with a 'name' parameter for
        the new collection name.
    :param id: The id of the collection to edit.
    :return: A JSON response with the status 200 if the collection is edited
        successfully, or a HTML page with the form to edit the collection if
        the request is a GET request.
    :raises: HttpResponse or JsonResponse with status 500 if there is an error,
        or if the collection already exists.
    """
    name = dict(request.POST)["name"][0]
    collection = Collection.objects.get(id=id)
    try:
        collection.name = name
        collection.save()
        return HttpResponse(status=200)
    except Exception as e:
        s = str(e)
        if "duplicate key value" in s:
            errorText = f"Cannot rename collection to {name}\n"
            errorText += "Collection already exists"
            return error(errorText)
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

    all_posts = displayed_user.posts.all().order_by('-time_posted')
    posts_paginator = Paginator(all_posts, 16)
    posts = posts_paginator.get_page(1)

    all_collections = displayed_user.collections.all().order_by('-updated_on')
    collections_paginator = Paginator(all_collections, 16)
    collections = collections_paginator.get_page(1)

    followings = request.user.followed.all()
    all_followed = set([following.followed for following in followings])
    user_follows = displayed_user in all_followed

    followers_followings = displayed_user.followers.all()
    followers = [
        {
            "username": following.follower.username,
            "id": following.follower.id
        }
        for following in followers_followings]

    followed_followings = displayed_user.followed.all()
    followed = [
        {
            "username": following.followed.username,
            "id": following.followed.id
        }
        for following in followed_followings]

    return render(request, 'posts/user.html', {
        "displayed_user": displayed_user,
        "post_list": posts,
        "collections": collections,
        "post_count": posts_paginator.count,
        "collections_count": collections_paginator.count,
        "user_follows": user_follows,
        "followers": followers,
        "followed": followed,
        "dark_theme": check_theme(request),
    })


def follow_user(request):
    """
    Adds a user to the list of users that the current user is following.

    :param request: The request object.
    :return: A success or error message.
    """
    followed_id = int(dict(request.POST)["followed"][0])
    if followed_id != request.user.id:
        followings = request.user.followed.all()
        all_followed = set([following.followed for following in followings])
        new_followed = User.objects.get(id=followed_id)
        if new_followed not in all_followed:
            Following.objects.create(
                follower=request.user, followed=new_followed)
            return success(f"Now following {new_followed.username}")
        else:
            return error("Already following this user")
    else:
        return error("You cannot follow yourself")


def unfollow_user(request):
    """
    Removes a user from the list of users that the current user is following.

    :param request: The request object.
    :return: A success or error message.
    """
    followed_id = int(dict(request.POST)["followed"][0])
    if followed_id != request.user.id:
        followings = request.user.followed.all()
        all_followed = set([following.followed for following in followings])
        unfollowed = User.objects.get(id=followed_id)
        if unfollowed in all_followed:
            following = Following.objects.get(
                follower=request.user, followed=unfollowed)
            following.delete()
            return success(f"No longer following {unfollowed.username}")
        else:
            return error("Already following this user")
    else:
        return error("You cannot unfollow yourself")
