"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/peopleHub").build();
var currentUser = '';

function promptUsername() {
    Swal.fire({
        title: 'Ingrese su nombre',
        input: 'text',
        allowOutsideClick: false,
        allowEscapeKey: false, // Deshabilita cerrar con tecla ESC
        allowEnterKey: true, // Permite enviar el formulario con la tecla ENTER
        stopKeydownPropagation: false, // Previene que SweetAlert2 maneje eventos de teclado
        showCancelButton: false, // Elimina el botón de cancelar
        showConfirmButton: true,
        confirmButtonText: 'Continuar',
        inputValidator: (value) => {
            if (!value) {
                return '¡Necesitas escribir un nombre!';
            }
            return connection.invoke("ValidateUsername", value).then((isValid) => {
                if (!isValid) {
                    return 'Este nombre ya está en uso, elija otro.';
                }
                currentUser = value;
                document.getElementById("currentUserName").textContent = currentUser;
                connection.invoke("AddUser", currentUser);
            });
        }
    });
}

connection.on("UpdateUserList", function (users) {
    var list = document.getElementById("usersList");
    list.innerHTML = '';
    users.forEach(function (user) {
        var li = document.createElement("tr");
        li.innerHTML = `<td style="color: ${user === currentUser ? 'red' : 'black'};">${user}</td>`;
        list.appendChild(li);
    });
    document.getElementById("userCount").textContent = users.length;
});

connection.start().then(function () {
    promptUsername();
}).catch(function (err) {
    return console.error(err.toString());
});

window.addEventListener("beforeunload", function () {
    connection.invoke("RemoveUser", currentUser);
});
