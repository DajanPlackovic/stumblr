from django.shortcuts import render
from .models import Post
from .forms import CreatePostForm


# Create your views here.
def index(request):
    post_list = Post.objects.all()
    return render(request, 'posts/index.html', {
        "post_list": post_list
    })


def create_post(request):
    create_post_form = CreatePostForm()
    return render(request, 'posts/create_post_form.html', {
        "create_post_form": create_post_form,
    })
