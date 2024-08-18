from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify


# Create your models here.
class Post(models.Model):
    text = models.TextField(max_length=10000)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    reblogged = models.ForeignKey(
        "self", on_delete=models.CASCADE, related_name="reblogs", null=True, blank=True)
    time_posted = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.author.username} | {self.text}"


class Collection(models.Model):
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
        print(self.slug)
        super().save(**kwargs)
