import os
import paramiko
from dotenv import load_dotenv

load_dotenv()

host = os.getenv('hostinger_host')
port = int(os.getenv('hostinger_port'))
user = os.getenv('hostinger_user')
password = os.getenv('hostinger_pass')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=port, username=user, password=password)

cmds = [
    'ls -la /home/u896915843/domains/cabapropiedades.ar/nodejs/public/properties/',
    'ls -la /home/u896915843/domains/cabapropiedades.ar/nodejs/public/properties/San_José_de_Calasanz_500/',
    'ls -la /home/u896915843/domains/cabapropiedades.ar/nodejs/public/properties/San_Jose_de_Calasanz_500/',
    'ls -la /home/u896915843/domains/cabapropiedades.ar/nodejs/dist/properties/',
    'ls -la /home/u896915843/domains/cabapropiedades.ar/nodejs/dist/properties/San_José_de_Calasanz_500/',
    'ls -la /home/u896915843/domains/cabapropiedades.ar/nodejs/dist/properties/San_Jose_de_Calasanz_500/',
]

for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd)
    print(f'\n>>> {cmd}')
    print(stdout.read().decode(errors='replace'))
    err = stderr.read().decode()
    if err:
        print('ERR:', err)

client.close()
