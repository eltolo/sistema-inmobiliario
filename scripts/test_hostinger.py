import os
import io
import paramiko
from dotenv import load_dotenv

load_dotenv()

REMOTE_DIR = '/home/u896915843/domains/cabapropiedades.ar/nodejs'
REMOTE_HOME = '/home/u896915843'


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
    rc = stdout.channel.recv_exit_status()
    if out:
        print(out)
    if err:
        print('ERR:', err)
    print(f'RC: {rc}')
    return rc, out, err


def main():
    client = connect()
    try:
        # Write test script to server via SFTP to avoid shell quoting issues
        test_js = "import('./server.js').then(() => {\n  console.log('MODULO CARGADO');\n}).catch(e => {\n  console.error('ERROR', e);\n  process.exit(1);\n});\n"
        test_path = f'{REMOTE_DIR}/test_server.mjs'
        sftp = client.open_sftp()
        sftp.putfo(io.BytesIO(test_js.encode()), test_path)
        sftp.close()

        run(
            client,
            f'export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH && '
            f'export NODE_ENV=production && '
            f'cd {REMOTE_DIR} && '
            f'timeout 5 node test_server.mjs',
            timeout=30,
        )
        run(client, f'cd {REMOTE_DIR} && tail -n 50 console.log && echo --- && tail -n 50 stderr.log')
    finally:
        client.close()


if __name__ == '__main__':
    main()
