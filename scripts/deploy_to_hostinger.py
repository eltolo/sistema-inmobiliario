import os
import datetime
import time
import paramiko
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

LOCAL_ZIP = Path(__file__).resolve().parent.parent / 'site_express.zip'
REMOTE_DIR = '/home/u896915843/domains/cabapropiedades.ar/nodejs'
PUBLIC_HTML_DIR = '/home/u896915843/domains/cabapropiedades.ar/public_html'
BACKUP_DIR = '/home/u896915843/backups'
TEMP_DIR = '/home/u896915843/nodejs_new'


def connect():
    host = os.getenv('hostinger_host')
    port = int(os.getenv('hostinger_port'))
    user = os.getenv('hostinger_user')
    password = os.getenv('hostinger_pass')
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=port, username=user, password=password)
    return client


def run(client, cmd, timeout=60):
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out:
        print(out)
    if err:
        print('ERR:', err)
    rc = stdout.channel.recv_exit_status()
    print(f'RC: {rc}')
    return rc, out, err


def backup(client):
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = f'{BACKUP_DIR}/nodejs_{timestamp}.tar.gz'
    run(client, f'mkdir -p {BACKUP_DIR}')
    rc, _, _ = run(client, f'tar -czf {backup_path} -C {REMOTE_DIR} .', timeout=300)
    if rc == 0:
        print(f'Backup creado: {backup_path}')
    return backup_path, rc == 0


def upload(client, local_path, remote_path):
    sftp = client.open_sftp()
    print(f'Uploading {local_path} -> {remote_path}')
    sftp.put(str(local_path), remote_path)
    sftp.close()


def deploy(client, remote_zip):
    # Limpiar y descomprimir en temp
    run(client, f'rm -rf {TEMP_DIR} && mkdir -p {TEMP_DIR}')
    run(client, f'unzip -q {remote_zip} -d {TEMP_DIR}', timeout=120)
    # Listar contenido
    run(client, f'ls -la {TEMP_DIR}')
    # Mover contenido actual a old y mover nuevo a destino
    run(client, f'rm -rf {REMOTE_DIR}_old && mv {REMOTE_DIR} {REMOTE_DIR}_old')
    run(client, f'mv {TEMP_DIR} {REMOTE_DIR}')


def install_and_restart(client):
    rc, _, _ = run(
        client,
        f'export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH && cd {REMOTE_DIR} && npm install --omit=dev',
        timeout=300,
    )
    # Restart Passenger
    run(client, f'mkdir -p {REMOTE_DIR}/tmp && touch {REMOTE_DIR}/tmp/restart.txt')
    return rc == 0


def verify(client):
    time.sleep(3)
    run(client, f'curl -s -o /dev/null -w "%{{http_code}}" http://localhost:80/ || true')
    run(client, f'ls -la {REMOTE_DIR}')


def main():
    if not LOCAL_ZIP.exists():
        print(f'ZIP no encontrado: {LOCAL_ZIP}')
        return

    client = connect()
    try:
        backup_path, ok = backup(client)
        if not ok:
            print('Backup falló. Abortando.')
            return

        remote_zip = f'/home/u896915843/site_express.zip'
        upload(client, LOCAL_ZIP, remote_zip)
        deploy(client, remote_zip)
        if install_and_restart(client):
            print('Deploy completado.')
        else:
            print('npm install falló.')
        verify(client)
    finally:
        client.close()


if __name__ == '__main__':
    main()
