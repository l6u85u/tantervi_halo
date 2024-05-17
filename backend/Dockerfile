FROM python:3.11.5

WORKDIR /app

COPY requirements.txt /app/

RUN pip install -r requirements.txt
RUN pip install django-extensions Werkzeug
RUN pip install pyOpenSSL==23.2.0

COPY . /app/

RUN chmod a+x run.sh

CMD cp certificates/plan.inf.elte.hu.key . && cp certificates/plan_inf_elte_hu_cert.cer . && sh -c '/app/run.sh'
