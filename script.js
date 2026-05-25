let allProducts = [];
let currentProducts = [];
let sortAZ = true;
let orders = JSON.parse(localStorage.getItem('vlshop_orders')) || [];

const menuContainer = document.getElementById("menuContainer");
const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const sortBtn = document.getElementById("sortBtn");
const sidebar = document.getElementById("sidebar");
const productModal = document.getElementById("productModal");

if(document.getElementById("openMenu")){
document.getElementById("openMenu").onclick = () => sidebar.classList.add("active");
}
if(document.getElementById("closeMenu")){
document.getElementById("closeMenu").onclick = () => sidebar.classList.remove("active");
}
window.onclick = (e) => { if(e.target === sidebar) sidebar.classList.remove("active"); };
if(document.getElementById("closeProductModal")){
document.getElementById("closeProductModal").onclick = () => productModal.classList.remove("active");
}

function initTheme() {
    const savedTheme = localStorage.getItem('vlshop_theme');
    const themeToggle = document.getElementById('themeToggle');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if(themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if(themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark-theme');
            if(themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        } else {
            document.body.classList.add('light-theme');
            if(themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
    }
}

function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('vlshop_theme', 'light');
        if(themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('vlshop_theme', 'dark');
        if(themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
initTheme();

fetch("product.json")
.then(res => res.json())
.then(data => {
allProducts = data;
currentProducts = data;
const menus = [...new Set(data.map(item => item.produkmenu))];
const allBtn = document.createElement("button");
allBtn.textContent = "All Product";
allBtn.classList.add("active");
allBtn.onclick = () => { setActive(allBtn); renderProducts(data); };
if(menuContainer) menuContainer.appendChild(allBtn);
menus.forEach(menu => {
const btn = document.createElement("button");
btn.textContent = menu;
btn.onclick = () => { setActive(btn); const filtered = data.filter(item => item.produkmenu === menu); renderProducts(filtered); };
if(menuContainer) menuContainer.appendChild(btn);
});
renderProducts(data);
});

function renderProducts(products){
if(!resultCount) return;
resultCount.innerHTML = products.length;
currentProducts = products;
if(!productContainer) return;
productContainer.innerHTML = "";
products.forEach((item,index)=>{
const shortText = item.deskripsi.length > 100 ? item.deskripsi.slice(0,100) + "..." : item.deskripsi;
const card = document.createElement("div");
card.className = "card";
card.innerHTML = `
<img src="${item.gambar}">
<div class="card-content">
<div class="product-name">${item.namaproduk}</div>
<div class="product-price">${item.harga}</div>
<div class="description" id="desc-${index}" data-full="${encodeURIComponent(item.deskripsi)}" data-short="${encodeURIComponent(shortText)}" data-open="false">${shortText}</div>
<button class="more-btn" onclick="toggleDesc(${index})">Read More ></button>
<button class="buy-btn" onclick='openProductModal(${JSON.stringify(item)})'>BUY NOW</button>
</div>
`;
productContainer.appendChild(card);
});
}

function toggleDesc(index){
const desc = document.getElementById(`desc-${index}`);
if(!desc) return;
const btn = desc.nextElementSibling;
const full = decodeURIComponent(desc.dataset.full);
const short = decodeURIComponent(desc.dataset.short);
const opened = desc.dataset.open === "true";
if(opened){
desc.innerHTML = short;
btn.innerHTML = "Read More >";
desc.dataset.open = "false";
}else{
desc.innerHTML = full;
btn.innerHTML = "Show Less >";
desc.dataset.open = "true";
}
}

function setActive(target){
document.querySelectorAll(".menu-wrapper button").forEach(btn=> btn.classList.remove("active"));
target.classList.add("active");
}

function openProductModal(product){
if(!productModal) return;
productModal.classList.add("active");
document.getElementById("modalProductImage").src = product.gambar;
document.getElementById("modalProductName").innerHTML = product.namaproduk;
const variantButtons = document.getElementById("variantButtons");
const desc2Box = document.getElementById("modalProductDesc2");
const desc2Text = document.getElementById("modalProductDesc2Text");
variantButtons.innerHTML = "";
if(product.varian && product.varian.length > 0){
desc2Box.style.display = "none";
variantButtons.style.display = "flex";
product.varian.forEach((variant)=>{
const button = document.createElement("button");
button.innerHTML = `${variant.nama} Rp${variant.harga.toLocaleString("id-ID")}`;
button.onclick = () => {
productModal.classList.remove("active");
openPaymentPage(product.namaproduk, variant.harga, product.gambar);
};
variantButtons.appendChild(button);
});
} else if(product.url){
desc2Box.style.display = "block";
variantButtons.style.display = "flex";
if(product.deskripsi2){
desc2Text.innerHTML = product.deskripsi2.replace(/\n/g,'<br>');
} else {
desc2Text.innerHTML = "";
}
const urlButton = document.createElement("a");
urlButton.href = product.url;
urlButton.target = "_blank";
urlButton.className = "url-button";
urlButton.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Order Now';
variantButtons.appendChild(urlButton);
} else {
desc2Box.style.display = "none";
variantButtons.style.display = "none";
}
}

function openPaymentPage(name, price, image) {
    const paymentWindow = window.open('', '_blank');
    const handling = 1000;
    const total = price + handling;
    
    const paymentHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Checkout - VL SHOP</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
            body {
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .checkout-container {
                max-width: 500px;
                margin: 0 auto;
            }
            .checkout-card {
                background: #101010;
                border-radius: 32px;
                border: 1px solid rgba(255,255,255,.1);
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0,0,0,.5);
            }
            .checkout-header {
                background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
                padding: 30px 24px;
                text-align: center;
                border-bottom: 1px solid rgba(255,255,255,.08);
            }
            .checkout-header h1 {
                font-size: 28px;
                font-weight: 800;
                background: linear-gradient(90deg, #fff, #888);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .checkout-body {
                padding: 24px;
            }
            .product-preview {
                display: flex;
                gap: 16px;
                background: #1a1a1a;
                border-radius: 20px;
                padding: 16px;
                margin-bottom: 24px;
            }
            .product-preview img {
                width: 80px;
                height: 80px;
                border-radius: 16px;
                object-fit: cover;
            }
            .info-card {
                background: #1a1a1a;
                border-radius: 20px;
                padding: 20px;
                margin-bottom: 20px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 14px;
                font-size: 14px;
            }
            .info-row.total {
                font-size: 18px;
                font-weight: 800;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid rgba(255,255,255,.1);
            }
            .wa-input {
                background: #1d1d1d;
                border: 1px solid rgba(255,255,255,.1);
                border-radius: 12px;
                padding: 10px;
                color: white;
                width: 160px;
                text-align: right;
            }
            .qr-box {
                background: white;
                border-radius: 20px;
                padding: 16px;
                text-align: center;
                margin-bottom: 20px;
            }
            .qr-box img {
                width: 200px;
                height: 200px;
                object-fit: contain;
            }
            .checkbox-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 20px 0;
            }
            .confirm-btn {
                width: 100%;
                padding: 16px;
                background: white;
                color: black;
                border: none;
                border-radius: 16px;
                font-weight: 800;
                font-size: 16px;
                cursor: pointer;
                transition: .2s;
            }
            .confirm-btn:hover {
                transform: scale(1.02);
            }
            .footer {
                text-align: center;
                padding: 20px;
                border-top: 1px solid rgba(255,255,255,.08);
                color: #666;
                font-size: 12px;
            }
            .qr-title {
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 12px;
                text-align: center;
            }
            @media(max-width:700px){
                .wa-input{width:100%;margin-top:8px;}
                .info-row{flex-wrap:wrap;}
            }
        </style>
    </head>
    <body>
        <div class="checkout-container">
            <div class="checkout-card">
                <div class="checkout-header">
                    <h1>VL SHOP</h1>
                    <p style="color: #888; margin-top: 8px;">Complete Your Payment</p>
                </div>
                <div class="checkout-body">
                    <div class="product-preview">
                        <img src="${image}" alt="Product">
                        <div>
                            <strong style="font-size: 16px;">${name.replace(/['"]/g, '\\"')}</strong>
                            <div style="color: #888; font-size: 13px; margin-top: 4px;">Quantity: 1</div>
                        </div>
                    </div>

                    <div class="info-card">
                        <div class="info-row">
                            <span>Harga Produk</span>
                            <span>Rp${price.toLocaleString("id-ID")}</span>
                        </div>
                        <div class="info-row">
                            <span>Biaya Penanganan</span>
                            <span>Rp1.000</span>
                        </div>
                        <div class="info-row">
                            <span>Nomor WhatsApp</span>
                            <input type="tel" id="customerWhatsapp" class="wa-input" placeholder="08xxxxxxxxxx">
                        </div>
                        <div class="info-row total">
                            <span>Total Pembayaran</span>
                            <span id="totalAmount">Rp${total.toLocaleString("id-ID")}</span>
                        </div>
                    </div>

                    <div class="qr-title">
                        <i class="fa-solid fa-qrcode"></i> Scan QR Code
                    </div>
                    <div class="qr-box">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=VL-SHOP-PAYMENT-${Date.now()}" alt="QR Code">
                    </div>
                    <p style="text-align: center; font-size: 12px; color: #888; margin-bottom: 20px;">Valid for 24 hours</p>

                    <label class="checkbox-wrapper">
                        <input type="checkbox" id="paidCheck">
                        <span>Saya sudah melakukan pembayaran</span>
                    </label>

                    <button class="confirm-btn" id="confirmPaymentBtn">
                        <i class="fa-solid fa-check"></i> Konfirmasi Pembayaran
                    </button>
                </div>
                <div class="footer">
                    © 2026 VL SHOP Developer Store
                </div>
            </div>
        </div>

        <script>
            document.getElementById('confirmPaymentBtn').onclick = () => {
                const checked = document.getElementById('paidCheck');
                const whatsapp = document.getElementById('customerWhatsapp').value.trim();
                
                if(!whatsapp) {
                    alert('Nomor WhatsApp wajib diisi!');
                    return;
                }
                if(!whatsapp.match(/^[0-9]{10,13}$/)) {
                    alert('Nomor WhatsApp tidak valid! Masukkan 10-13 digit angka.');
                    return;
                }
                if(!checked.checked) {
                    alert('Centang bahwa Anda sudah membayar');
                    return;
                }

                const invoiceNumber = "VL-" + Date.now() + Math.floor(Math.random() * 1000);
                const newOrder = {
                    invoice: invoiceNumber,
                    productName: "${name.replace(/['"]/g, '\\"')}",
                    price: ${price},
                    handling: 1000,
                    total: ${total},
                    image: "${image}",
                    customerWhatsapp: whatsapp,
                    date: new Date().toLocaleString('id-ID'),
                    status: 'pending'
                };

                let existingOrders = JSON.parse(localStorage.getItem('vlshop_orders') || '[]');
                existingOrders.unshift(newOrder);
                localStorage.setItem('vlshop_orders', JSON.stringify(existingOrders));

                window.location.href = 'invoice.html?invoice=' + invoiceNumber;
            };
        <\/script>
    </body>
    </html>
    `;
    
    paymentWindow.document.write(paymentHtml);
    paymentWindow.document.close();
}

function showToast(message, type = 'info'){
    const existingToast = document.querySelector('.toast-notification');
    if(existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    let icon = '';
    if(type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
    else if(type === 'error') icon = '<i class="fa-solid fa-circle-exclamation"></i>';
    else if(type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    else icon = '<i class="fa-solid fa-info-circle"></i>';
    toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-message">${message}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function trackOrder(){
const input = document.getElementById("trackingInput").value;
const result = document.getElementById("trackResult");
if(!input){
result.style.display = "block";
result.innerHTML = `<b>Status:</b> ID pesanan tidak ditemukan`;
return;
}
const order = orders.find(o => o.invoice === input);
if(!order){
result.style.display = "block";
result.innerHTML = `<b>Status:</b> Pesanan dengan ID ${input} tidak ditemukan`;
return;
}
const statusText = order.status === 'pending' ? 'Pending' : 'Selesai';
result.style.display = "block";
result.innerHTML = `<b>Invoice:</b> ${order.invoice}<br><b>Produk:</b> ${order.productName}<br><b>Total:</b> Rp${order.total.toLocaleString("id-ID")}<br><b>Status:</b> ${statusText}<br><b>Tanggal:</b> ${order.date}`;
}

function showMainContent(){
if(sidebar) sidebar.classList.remove("active");
const mainContainer = document.getElementById("mainContainer");
if(mainContainer) mainContainer.style.display = "block";
}

function showTrackingPage(){
if(sidebar) sidebar.classList.remove("active");
const mainContainer = document.getElementById("mainContainer");
if(mainContainer) mainContainer.style.display = "block";
const trackResult = document.getElementById("trackResult");
if(trackResult) trackResult.scrollIntoView({behavior:"smooth"});
}

window.trackOrder = trackOrder;
window.toggleDesc = toggleDesc;
window.openProductModal = openProductModal;
window.showMainContent = showMainContent;
window.showTrackingPage = showTrackingPage;

if(searchInput){
searchInput.addEventListener("input",()=>{
const keyword = searchInput.value.toLowerCase();
const filtered = allProducts.filter(item => item.namaproduk.toLowerCase().includes(keyword));
renderProducts(filtered);
});
}

if(sortBtn){
sortBtn.addEventListener("click",()=>{
sortAZ = !sortAZ;
sortBtn.innerHTML = sortAZ ? '<i class="fa-solid fa-arrow-down-a-z"></i>' : '<i class="fa-solid fa-arrow-down-z-a"></i>';
const sorted = [...currentProducts].sort((a,b)=> sortAZ ? a.namaproduk.localeCompare(b.namaproduk) : b.namaproduk.localeCompare(a.namaproduk));
renderProducts(sorted);
});
}