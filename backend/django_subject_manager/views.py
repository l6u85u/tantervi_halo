from django.http import JsonResponse
from . import input_handler
import json

def response(request,path,index):
    #path = kwargs.get('path', 'Unknown')
    inputHandler = input_handler.ExcelInputHandler(path,index)
    resp = inputHandler.convert_to_json()
    return JsonResponse(resp, safe=False, json_dumps_params={'ensure_ascii': False})
