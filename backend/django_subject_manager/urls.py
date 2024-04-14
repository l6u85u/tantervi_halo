from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    #path('admin/', admin.site.urls),
    path('modellezo/', views.response, name="modellezo", kwargs={'path': 'django_subject_manager/input/nappali.xlsx', 'index':0}),
    path('tervezo/', views.response, name="tervezo", kwargs={'path': 'django_subject_manager/input/nappali.xlsx', 'index':1}),
    path('fejleszto/', views.response, name="fejleszto", kwargs={'path': 'django_subject_manager/input/nappali.xlsx', 'index':2}),
    path('esti/', views.response, name="esti", kwargs={'path': 'django_subject_manager/input/esti.xlsx', 'index':0}),
    path('szombathely/', views.response, name="szombathely", kwargs={'path': 'django_subject_manager/input/szombathely.xlsx', 'index':0}),
    path('angol/', views.response, name="angol", kwargs={'path': 'django_subject_manager/input/angol.xlsx', 'index':0}),
    
]