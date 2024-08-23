import csv
from random import choice, sample, randint
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from posts.models import Post, Collection


class Command(BaseCommand):
    help = "Creates test data"

    def handle(self, *args, **options):
        # with open('mockdata/usernames.csv', 'r') as file:
        #     reader = csv.DictReader(file)
        #     for row in reader:
        #         User.objects.create_user(username=row["username"])
        # with open('mockdata/posts.csv', 'r') as file:
        #     reader = csv.DictReader(file)
        #     for row in reader:
        #         author = choice(User.objects.all())
        #         Post.objects.create(
        #             text=row["text"], author=author)
        with open('mockdata/collections.csv', 'r') as file:
            all_posts = list(Post.objects.all())
            all_users = list(User.objects.all())
            reader = csv.DictReader(file)
            for row in reader:
                author = choice(all_users)
                num_of_posts = randint(1, 30)
                posts = sample(all_posts, num_of_posts)
                name = row["name"][:40]
                print(name)
                if Collection.objects.filter(name=name).count() == 0:
                    collection = Collection.objects.create(
                        name=name[:20], author=author)
                    for post in posts:
                        collection.posts.add(post)
