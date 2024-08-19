from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from .models import Post, Collection
from .forms import CreatePostForm


# Create your views here.
# Post Views
def index(request):
    post_list = Post.objects.all().order_by('-time_posted')
    return render(request, 'posts/index.html', {
        "post_list": post_list
    })


def create_post(request):
    # @TODO: add error handling
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


def delete_post(request, post_id):
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
def collection_list(request):
    collections = Collection.objects.all()
    return render(request, 'posts/collections.html', {
        "collections": collections
    })


def individual_collection(request, slug):
    collection = get_object_or_404(Collection, slug=slug)
    posts = collection.posts.all()
    return render(request, 'posts/single_collection.html', {
        "collection": collection,
        "post_list": posts,
    })


def collection_menu(request, post_id):
    if request.method == 'POST':
        post = get_object_or_404(Post, pk=post_id)
        for collection in request.user.collections.all():
            collection.posts.remove(post)
        collections = dict(request.POST)["collection"]
        for id in collections:
            collection = get_object_or_404(Collection, pk=id)
            if request.user == collection.author:
                post.collections.add(collection)
        return HttpResponse(status=200)
    else:
        collections = request.user.collections.all()
        response = [{"name": collection.name, "id": collection.id,
                    "checked": collection.posts.filter(id=post_id).count() > 0} for collection in collections]
        return JsonResponse({"response": response})
