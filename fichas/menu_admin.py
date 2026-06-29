import os
import json
import subprocess
import sys

# Configuración de rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")
UPDATE_SCRIPT = os.path.join(BASE_DIR, "update_web.py")

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def load_config():
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_config(config):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

def manage_contact_data():
    config = load_config()
    while True:
        clear_screen()
        print("=== GESTIÓN DE DATOS DE CONTACTO ===")
        print(f"1. WhatsApp: {config['whatsapp']}")
        print(f"2. Email: {config['email']}")
        print(f"3. Instagram: {config['instagram']}")
        print("0. Volver")
        
        opcion = input("\nSeleccione qué dato modificar: ")
        if opcion == "1":
            config['whatsapp'] = input("Nuevo WhatsApp (ej: 54911...): ")
        elif opcion == "2":
            config['email'] = input("Nuevo Email: ")
        elif opcion == "3":
            config['instagram'] = input("Nuevo Instagram: ")
        elif opcion == "0":
            break
        save_config(config)

def manage_properties():
    while True:
        clear_screen()
        print("=== GESTIÓN DE PROPIEDADES ===")
        folders = [f for f in os.listdir(BASE_DIR) if os.path.isdir(os.path.join(BASE_DIR, f)) and f != "web-propiedades" and not f.startswith('.')]
        
        for i, folder in enumerate(folders, 1):
            status_file = os.path.join(BASE_DIR, folder, "status.txt")
            status = "Disponible"
            if os.path.exists(status_file):
                with open(status_file, 'r') as f: status = f.read().strip()
            print(f"{i}. {folder} [{status}]")
        
        print("\n0. Volver")
        sel = input("\nSeleccione propiedad para cambiar estado: ")
        
        if sel == "0": break
        try:
            folder = folders[int(sel)-1]
            print(f"\nCambiando estado para: {folder}")
            print("1. Disponible")
            print("2. Alquilado")
            print("3. Vendido")
            print("4. Reservado")
            
            st_sel = input("Nuevo estado: ")
            status_map = {"1": "Disponible", "2": "Alquilado", "3": "Vendido", "4": "Reservado"}
            new_status = status_map.get(st_sel)
            
            if new_status:
                with open(os.path.join(BASE_DIR, folder, "status.txt"), 'w') as f:
                    f.write(new_status)
                print(f"¡Estado actualizado a {new_status}!")
                input("\nPresione Enter para continuar...")
        except:
            pass

def main_menu():
    while True:
        clear_screen()
        print("========================================")
        print("   QUINTANA PROP - PANEL DE CONTROL     ")
        print("========================================")
        print("1. Sincronizar Web (Correr update_web.py)")
        print("2. Gestionar Estados (Vendido/Alquilado)")
        print("3. Modificar Datos de Contacto")
        print("4. Ver Logs del Agente")
        print("0. Salir")
        print("========================================")
        
        opcion = input("\nSeleccione una opción: ")
        
        if opcion == "1":
            print("\nSincronizando...")
            subprocess.run([sys.executable, UPDATE_SCRIPT])
            input("\nPresione Enter para volver...")
        elif opcion == "2":
            manage_properties()
        elif opcion == "3":
            manage_contact_data()
        elif opcion == "4":
            log_path = os.path.join(BASE_DIR, "metricas_completitud.log")
            if os.path.exists(log_path):
                with open(log_path, 'r') as f: print(f.read())
            else:
                print("No hay logs disponibles.")
            input("\nPresione Enter para volver...")
        elif opcion == "0":
            break

if __name__ == "__main__":
    main_menu()
