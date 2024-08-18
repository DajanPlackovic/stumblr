from django.db import models
from django.contrib.auth.models import User


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
    name = models.CharField(max_length=200)
    posts = models.ManyToManyField(Post, blank=True)

    def __str__(self):
        return self.name
