
import paho.mqtt.client as paho

from paho import mqtt
import json
import datetime

client = paho.Client(client_id="", userdata=None) #, protocol=paho.MQTTv5)
client.connect("public.mqtthq.com", 1883)
client.subscribe("fdrs/data", qos=0)

def mensajeRecibido(client, userdata, msg):
    mensaje = json.load(msg)
    fecha = datetime.datetime.fromtimestamp(mensaje["time"])
    #invocar funcion a implementar para guardar en la base segun el tipo de dato, ej:
    #if(mensaje["type"] == 1)
        #validar valores segun el tipo de dato
        #base.saveTemperatura(mensaje["id"], mensaje["data"], fecha)
    print("Tienes un mensaje")

client.on_message = mensajeRecibido
client.loop_forever()