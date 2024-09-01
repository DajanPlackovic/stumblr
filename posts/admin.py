from django.contrib import admin
from .models import Post, Collection, Following, DarkTheme

# Register your models here.
admin.site.register(Post)
admin.site.register(Collection)
admin.site.register(Following)
admin.site.register(DarkTheme)
