# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0006_remove_post_comments_enabled_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='can_comment',
        ),
    ]


















