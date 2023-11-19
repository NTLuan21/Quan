const form = document.getElementById("login");
form.addEventListener("submit", directUser);

function directUser(event) {
  event.preventDefault();
  const formData = new FormData(form);

  const username = formData.get("username");
  const password = formData.get("Password");

  console.log(username);

  if (username.indexOf(".phuong") != -1) {
    window.location.href = "./Static/Phuong/index.html";
    return false;
  } else if (username.indexOf(".quan") != -1) {
    window.location.href = "./Static/Quan/index.html";
    return false;
  } else if (username.indexOf(".soVHTT") != -1) {
    window.location.href = "./Static/So VHTT/index.html";
    return false;
  } else {
    window.location.href = "./Static/NguoiDan/index.html";
    return false;
  }
}
