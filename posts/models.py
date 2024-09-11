from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify


# Create your models here.
class Post(models.Model):
    """
    The Post model for individual posts consisting of the text content,
    the author, the reblogged post and the time posted.
    """
    text = models.TextField(max_length=10000)
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="posts")
    reblogged = models.ForeignKey(
        "self", on_delete=models.CASCADE, related_name="reblogs",
        null=True, blank=True)
    time_posted = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.author.username} | {self.text}"


class Collection(models.Model):
    """
    The Collection model for a collection of posts, consisting of a name,
    a many to many field for all the associated posts and the author field
    containing the Foreign Key of the User who create the collection.
    """
    name = models.CharField(max_length=200, unique=True)
    posts = models.ManyToManyField(
        Post, blank=True, related_name="collections")
    author = models.ForeignKey(
        User, default=1, on_delete=models.CASCADE, related_name="collections")
    created_on = models.DateTimeField(auto_now_add=True)
    slug = models.SlugField(unique=True)
    updated_on = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def save(self, **kwargs):
        self.slug = slugify(f"{self.author.username}-{self.name}")
        super().save(**kwargs)


class Following(models.Model):
    """
    The Following model connecting two users via Foreign Keys, the follower
    with the followed.
    """
    follower = models.ForeignKey(
        User, related_name="followed", on_delete=models.CASCADE)
    followed = models.ForeignKey(
        User, related_name="followers", on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.follower.username} follows {self.followed.username}"
