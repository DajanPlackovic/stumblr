import csv
from random import choice
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from posts.models import Post


class Command(BaseCommand):
    help = "Creates test data"

    def handle(self):
        with open('mockdata/usernames.csv', 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                User.objects.create_user(username=row["username"])
        with open('mockdata/posts.csv', 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                author = choice(User.objects.all())
                Post.objects.create(
                    text=row["text"], author=author)
