from django.http import JsonResponse
from . import input_handler
import json

def response_modellezo(request):
    response = input_handler.response_from_excel('django_subject_manager/input/nappali.xlsx',8,27,39,19,0)
    return JsonResponse(response, safe=False, json_dumps_params={'ensure_ascii': False})

def response_tervezo(request):
    response = input_handler.response_from_excel('django_subject_manager/input/nappali.xlsx',10,27,41,20,1)
    return JsonResponse(response, safe=False, json_dumps_params={'ensure_ascii': False})

def response_fejleszto(request):
    response = input_handler.response_from_excel('django_subject_manager/input/nappali.xlsx',8,27,39,16,2)
    return JsonResponse(response, safe=False, json_dumps_params={'ensure_ascii': False})

def response_esti(request):
    response = input_handler.response_from_excel('django_subject_manager/input/esti.xlsx',8,25,45,15,0)
    return JsonResponse(response, safe=False, json_dumps_params={'ensure_ascii': False})

def response_szombathely(request):
    response = input_handler.response_from_excel('django_subject_manager/input/szombathely.xlsx',8,27,41,19,0)
    return JsonResponse(response, safe=False, json_dumps_params={'ensure_ascii': False})


def response_angol(request):
    response = input_handler.response_from_excel('django_subject_manager/input/angol.xlsx',6,43,-1,-1,0)
    return JsonResponse(response, safe=False, json_dumps_params={'ensure_ascii': False})
