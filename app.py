from flask import Flask, render_template, request, redirect, url_for, session, flash

app = Flask(__name__)
app.secret_key = 'replace_this_with_a_random_secret_key'

# Demo credentials
VALID_USERNAME = 'demo_user'
VALID_PASSWORD = 'demo_pass'

@app.route('/')
def home():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == VALID_USERNAME and password == VALID_PASSWORD:
            session['logged_in'] = True
            flash('Logged in successfully.', 'success')
            return redirect(url_for('home'))
        else:
            flash('Invalid credentials.', 'danger')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out.', 'info')
    return redirect(url_for('login'))

# ----- In‑memory storage -----
drivers = []  # {id, name, license}
vehicles = []  # {id, plate, model}

def _next_id(collection):
    return max([item["id"] for item in collection], default=0) + 1

# ----- Drivers -----
@app.route('/drivers', methods=['GET', 'POST'])
def drivers_view():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    if request.method == 'POST':
        name = request.form.get('name')
        license_no = request.form.get('license')
        drivers.append({"id": _next_id(drivers), "name": name, "license": license_no})
        flash('Driver added.', 'success')
        return redirect(url_for('drivers_view'))
    return render_template('drivers.html', drivers=drivers)

@app.route('/drivers/delete/<int:driver_id>')
def drivers_delete(driver_id):
    global drivers
    drivers = [d for d in drivers if d["id"] != driver_id]
    flash('Driver removed.', 'info')
    return redirect(url_for('drivers_view'))

# ----- Vehicles -----
@app.route('/vehicles', methods=['GET', 'POST'])
def vehicles_view():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    if request.method == 'POST':
        plate = request.form.get('plate')
        model = request.form.get('model')
        vehicles.append({"id": _next_id(vehicles), "plate": plate, "model": model})
        flash('Vehicle added.', 'success')
        return redirect(url_for('vehicles_view'))
    return render_template('vehicles.html', vehicles=vehicles)

@app.route('/vehicles/delete/<int:vehicle_id>')
def vehicles_delete(vehicle_id):
    global vehicles
    vehicles = [v for v in vehicles if v["id"] != vehicle_id]
    flash('Vehicle removed.', 'info')
    return redirect(url_for('vehicles_view'))


if __name__ == '__main__':
    # Custom port 5001
    app.run(host='0.0.0.0', port=5001, debug=True)
