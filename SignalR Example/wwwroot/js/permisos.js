"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/permisosHub").build();
var currentUser = '';
var role = '';

function promptUsername() {
    Swal.fire({
        title: 'Ingrese su nombre',
        input: 'text',
        allowOutsideClick: false,
        allowEscapeKey: false,
        inputValidator: (value) => {
            if (!value) {
                return '¡Necesitas escribir un nombre!';
            }
            currentUser = value;
            document.getElementById("currentUserName").innerHTML = currentUser;
            promptRole();
        }
    });
}

function promptRole() {
    Swal.fire({
        title: 'Seleccione su rol',
        input: 'select',
        inputOptions: {
            'usuario': 'Usuario',
            'admin': 'Administrador'
        },
        inputPlaceholder: 'Selecciona tu rol',
        showCancelButton: false,
        inputValidator: (value) => {
            if (!value) {
                return 'Debes seleccionar un rol';
            }
            role = value;
            connection.invoke("RegisterUser", currentUser, role);

            if (role === "usuario") {
                document.getElementById("requestPermissionBtn").style.display = 'block';
            }
        }
    });
}


document.getElementById("requestPermissionBtn").addEventListener("click", function (event) {
    connection.invoke("RequestPermission", currentUser);
    this.disabled = true;
    setTimeout(() => {
        this.disabled = false;
    }, 60000); // Enable the button after one minute
});

connection.on("ReceivePermissionStatus", function (user, granted, adminName) {
    var message = granted ? `El administrador ${adminName} te ha dado permiso.` : `El administrador ${adminName} no te ha dado permiso.`;
    Swal.fire('Estado de Permiso', message, 'info');
});

connection.on("ReceiveRequest", function (userName, connectionId) {
    Swal.fire({
        title: 'Solicitud de Permiso',
        html: `El usuario <b>${userName}</b> solicitó permiso para ir al baño.`,
        showCancelButton: true,
        cancelButtonText: 'Denegar',
        confirmButtonText: 'Aceptar',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            connection.invoke("RespondToRequest", connectionId, true);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            connection.invoke("RespondToRequest", connectionId, false);
        }
    });
});

connection.on("RequestResponded", function (connectionId, granted, adminName) {
    Swal.close();
    Swal.fire({
        title: 'Solicitud Respondida',
        html: `La solicitud fue ${granted ? "aceptada" : "denegada"} por el administrador <b>${adminName}</b>.`,
        icon: 'info'
    });
});

connection.on("PermissionAlreadyResponded", function (status, adminName) {
    Swal.fire({
        title: 'Solicitud ya procesada',
        html: `Esta solicitud ya fue ${status} por el administrador <b>${adminName}</b>.`,
        icon: 'warning'
    });
});


function respondToRequest(user, granted) {
    connection.invoke("RespondToRequest", user, granted);
}

connection.on("UpdateUserList", function (users) {
    var list = document.getElementById("usersList");
    list.innerHTML = '';
    users.forEach(function (user) {
        var li = document.createElement("tr");
        li.innerHTML = `<td>${user.name}</td><td>${user.requested ? "Sí" : ""}</td><td>${user.permissionStatus}</td>`;
        list.appendChild(li);
    });
});

connection.start().then(function () {
    promptUsername();
}).catch(function (err) {
    return console.error(err.toString());
});
