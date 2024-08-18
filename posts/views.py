from django.shortcuts import render
from django.http import HttpResponse
from .models import Post
from .forms import CreatePostForm


# Create your views here.
def index(request):
    post_list = Post.objects.all()
    return render(request, 'posts/index.html', {
        "post_list": post_list
    })


def create_post(request):
    if request.method == "POST":
        create_post_form = CreatePostForm(data=request.POST)
        if create_post_form.is_valid():
            new_post = create_post_form.save(commit=False)
            new_post.author = request.user
            new_post.save()
            return HttpResponse(status=200)
    else:
        create_post_form = CreatePostForm()
        return render(request, 'posts/create_post_form.html', {
            "create_post_form": create_post_form,
        })
