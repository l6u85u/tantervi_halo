from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    #path('admin/', admin.site.urls),
    path('modellezo/', views.response_modellezo, name="modellezo"),
    path('tervezo/', views.response_tervezo, name="tervezo"),
    path('fejleszto/', views.response_fejleszto, name="fejleszto"),
    path('esti/', views.response_esti, name="esti"),
    path('szombathely/', views.response_szombathely, name="szombathely"),
    path('angol/', views.response_angol, name="angol"),
   
]
