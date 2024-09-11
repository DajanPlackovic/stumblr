from django.contrib import admin
from .models import Post, Collection, Following

# Register your models here.
admin.site.register(Post)
admin.site.register(Collection)
admin.site.register(Following)
