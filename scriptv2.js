document.addEventListener('DOMContentLoaded', () => {
    // NEW: Firm Selection
    const firmSelect = document.getElementById('firmSelect');

    const subjectInput = document.getElementById('subject'); // NEW

    const partyNameInput = document.getElementById('billToCustomerName'); // RENAMED
    const quoteDateInput = document.getElementById('quoteDate');
    const expiryDateDisplay = document.getElementById('expiryDateDisplay');
    const itemsContainer = document.getElementById('itemsContainer');
    const addItemBtn = document.getElementById('addItemBtn');
    const generateQuoteBtn = document.getElementById('generateQuoteBtn');
    const skuDatalist = document.getElementById('skuOptions');

    // NEW: Bill To details
    const billToCustomerAddress = document.getElementById('billToCustomerAddress');
    const billToContactPerson = document.getElementById('billToContactPerson');
    const billToContactNumber = document.getElementById('billToContactNumber'); // NEW: Contact Person Number

    // NEW: Ship To details
    const sameAsBillingCheckbox = document.getElementById('sameAsBilling');
    const shipToCustomerName = document.getElementById('shipToCustomerName');
    const shipToShippingAddress = document.getElementById('shipToShippingAddress');
    const shipToContactPerson = document.getElementById('shipToContactPerson');
    const shipToContactNumber = document.getElementById('shipToContactNumber'); // NEW: Shipping Contact Person Number

    // NEW: Place of Supply & Salesperson
    const placeOfSupplyInput = document.getElementById('placeOfSupply');
    const salespersonInput = document.getElementById('salesperson');

    // Elements for real-time summary display on input page
    const displaySubTotal = document.getElementById('displaySubTotal');
    const displayGSTAmount = document.getElementById('displayGSTAmount');
    const displayTotalAmount = document.getElementById('displayTotalAmount');

    // --- Initial Setup ---

    // Populate firm dropdown
    for (const key in firms) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = firms[key].name;
        firmSelect.appendChild(option);
    }
    // Set default firm or based on a pre-selected value if desired
    firmSelect.value = 'nexrise_rj'; // Default to Nexrise India Infra Pvt. Ltd. (RJ)

    // Populate datalist for SKUs
    masterComponents.forEach(component => {
        const option = document.createElement('option');
        option.value = component.sku;
        skuDatalist.appendChild(option);
    });

    // Set today's date as default
    const today = new Date();
    quoteDateInput.value = today.toISOString().split('T')[0];
    updateExpiryDate(); // Initial update

    // Trigger initial summary calculation
    addItemRow(); // Add first item row
    updateSummaryDisplays();

    // --- Event Listeners ---

    quoteDateInput.addEventListener('change', updateExpiryDate);
    addItemBtn.addEventListener('click', addItemRow);
    itemsContainer.addEventListener('input', handleItemInputChange);
    itemsContainer.addEventListener('click', handleRemoveItem);

    // NEW: Ship To "Same as Billing" logic
    sameAsBillingCheckbox.addEventListener('change', toggleShipToFields);
    billToCustomerName.addEventListener('input', copyBillToToShipTo);
    billToCustomerAddress.addEventListener('input', copyBillToToShipTo);
    billToContactPerson.addEventListener('input', copyBillToToShipTo);
    billToContactNumber.addEventListener('input', copyBillToToShipTo); // NEW: Contact Number

    generateQuoteBtn.addEventListener('click', generateQuote);

    // --- Functions ---

    function updateExpiryDate() {
        const quoteDate = new Date(quoteDateInput.value);
        if (!isNaN(quoteDate)) {
            const expiryDate = new Date(quoteDate);
            expiryDate.setDate(quoteDate.getDate() + 30);
            expiryDateDisplay.textContent = ` (Expiry Date: ${expiryDate.toLocaleDateString('en-GB')})`;
        } else {
            expiryDateDisplay.textContent = '';
        }
    }

    function createItemRow() {
        const itemRow = document.createElement('div');
        itemRow.classList.add('item-row');
        itemRow.innerHTML = `
            <input type="text" class="sku-input" placeholder="SKU" list="skuOptions">
            <input type="number" class="qty-input" placeholder="Qty" min="1" value="1">
            <span class="description-display"></span>
            <span class="rate-display"></span>
            <input type="number" class="discount-per-item-input" placeholder="Disc (%)" min="0" max="100" value="0">
            <span class="item-amount-display"></span>
            <button type="button" class="remove-item-btn">X</button>
        `;
        return itemRow;
    }

    function addItemRow() {
        itemsContainer.appendChild(createItemRow());
        updateSummaryDisplays();
    }

    function handleItemInputChange(event) {
        const target = event.target;
        const itemRow = target.closest('.item-row');
        if (!itemRow) return;

        const skuInput = itemRow.querySelector('.sku-input');
        const qtyInput = itemRow.querySelector('.qty-input');
        const descriptionDisplay = itemRow.querySelector('.description-display');
        const rateDisplay = itemRow.querySelector('.rate-display');
        const discountPerItemInput = itemRow.querySelector('.discount-per-item-input'); // NEW
        const itemAmountDisplay = itemRow.querySelector('.item-amount-display');

        let selectedComponent = null;

        // Handle SKU input change
        if (target === skuInput) {
            selectedComponent = masterComponents.find(c => c.sku.toLowerCase() === skuInput.value.toLowerCase());
            if (selectedComponent) {
                descriptionDisplay.textContent = selectedComponent.description;
                rateDisplay.textContent = selectedComponent.rate.toFixed(2);
            } else {
                descriptionDisplay.textContent = 'Invalid SKU';
                rateDisplay.textContent = '0.00';
            }
        } else {
            // If quantity or discount changes, re-find component if SKU is already set
            selectedComponent = masterComponents.find(c => c.sku.toLowerCase() === skuInput.value.toLowerCase());
        }

        // Calculate item amount
        if (selectedComponent && !isNaN(qtyInput.value) && qtyInput.value > 0) {
            const qty = parseFloat(qtyInput.value);
            const rate = selectedComponent.rate;
            const itemDiscountPercent = parseFloat(discountPerItemInput.value) || 0;
            const netRate = rate * (1 - itemDiscountPercent / 100);
            const amount = qty * netRate;
            itemAmountDisplay.textContent = amount.toFixed(2);
        } else {
            itemAmountDisplay.textContent = '0.00';
        }

        updateSummaryDisplays();
    }

    function handleRemoveItem(event) {
        if (event.target.classList.contains('remove-item-btn')) {
            const itemRow = event.target.closest('.item-row');
            if (itemRow && itemsContainer.children.length > 1) { // Ensure at least one row remains
                itemRow.remove();
            } else if (itemsContainer.children.length === 1) {
                // If only one row left, clear it instead of removing
                const skuInput = itemRow.querySelector('.sku-input');
                const qtyInput = itemRow.querySelector('.qty-input');
                const descriptionDisplay = itemRow.querySelector('.description-display');
                const rateDisplay = itemRow.querySelector('.rate-display');
                const discountPerItemInput = itemRow.querySelector('.discount-per-item-input'); // NEW
                const itemAmountDisplay = itemRow.querySelector('.item-amount-display');

                skuInput.value = '';
                qtyInput.value = '1';
                descriptionDisplay.textContent = '';
                rateDisplay.textContent = '';
                discountPerItemInput.value = '0'; // NEW: Reset discount
                itemAmountDisplay.textContent = '';
            }
            updateSummaryDisplays();
        }
    }

    function updateSummaryDisplays() {
        let currentSubTotal = 0; // This will be the sum of amounts AFTER per-item discounts

        const itemRows = itemsContainer.querySelectorAll('.item-row');
        itemRows.forEach(row => {
            const itemAmountText = row.querySelector('.item-amount-display').textContent;
            const itemAmount = parseFloat(itemAmountText) || 0; // Get the net amount calculated in handleItemInputChange
            currentSubTotal += itemAmount;
        });

        // No global discount anymore
        const currentGSTAmount = currentSubTotal * 0.18; // 18% GST on the subtotal (after item discounts)
        const currentTotalAmount = currentSubTotal + currentGSTAmount;

        displaySubTotal.textContent = `Rs.${currentSubTotal.toFixed(2)}`;
        displayGSTAmount.textContent = `Rs.${currentGSTAmount.toFixed(2)}`;
        displayTotalAmount.textContent = `Rs.${currentTotalAmount.toFixed(2)}`;
    }

    // NEW: Ship To "Same as Billing" functionality
    function toggleShipToFields() {
        const isSame = sameAsBillingCheckbox.checked;
        shipToCustomerName.disabled = isSame;
        shipToShippingAddress.disabled = isSame;
        shipToContactPerson.disabled = isSame;

        if (isSame) {
            copyBillToToShipTo();
        } else {
            shipToCustomerName.value = '';
            shipToShippingAddress.value = '';
            shipToContactPerson.value = '';
            shipToContactNumber.value = ''; // NEW: Reset Shipping Contact Number
        }
    }

    function copyBillToToShipTo() {
        if (sameAsBillingCheckbox.checked) {
            shipToCustomerName.value = billToCustomerName.value;
            shipToShippingAddress.value = billToCustomerAddress.value;
            shipToContactPerson.value = billToContactPerson.value;
            shipToContactNumber.value = billToContactNumber.value; // NEW: Copy Contact Number
        }
    }


    // Generate random 4-digit suffix
    function generateRandomQuoteSuffix() {
        return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a number between 1000 and 9999
    }

    // Generate number in words
    function numberToWords(num) {
    const a = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = [
        '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];
    const units = [
        { value: 10000000, str: 'Crore' },
        { value: 100000, str: 'Lakh' },
        { value: 1000, str: 'Thousand' },
        { value: 100, str: 'Hundred' }
    ];

    // Helper function to convert a number to words
    function convertNumberToWords(n) {
        let words = '';

        // Loop through the units array (Crore, Lakh, Thousand, Hundred)
        for (let i = 0; i < units.length; i++) {
            if (Math.floor(n / units[i].value) > 0) {
                words += convertNumberToWords(Math.floor(n / units[i].value)) + ' ' + units[i].str + ' ';
                n %= units[i].value;
            }
        }

        // Handle numbers 20 and above
        if (n > 19) {
            words += b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
        } 
        // Handle numbers 1 to 19
        else if (n > 0) {
            words += a[n] + ' ';
        }

        return words.trim();
    }

    // If the number is zero
    if (num === 0) return 'Zero Rupees Only';

    // Split the number into rupees and paisa (decimal part)
    let rupees = Math.floor(num);
    let paisa = num % 1;  // Get the fractional part

    // Convert the rupees part to words
    let result = convertNumberToWords(rupees) + ' Rupees';

    // If there is a paisa part, convert it to words with two decimal places
    if (paisa > 0) {
        // Convert paisa to two decimal places without rounding
        paisa = paisa.toFixed(2).split('.')[1];  // Keep exactly two decimal places
        result += ' and ' + convertNumberToWords(parseInt(paisa)) + ' Paise';
    }

    // Append "Only" to the final result
    return result + ' Only';
}



    function generateQuote() {
        const selectedFirmKey = firmSelect.value;
        const selectedFirm = firms[selectedFirmKey];
        if (!selectedFirm) {
            alert('Please select a valid firm.');
            return;
        }

        const subject = subjectInput.value.trim(); // NEW
        const billToCustName = billToCustomerName.value.trim(); // RENAMED
        const billToCustAddress = billToCustomerAddress.value.trim(); // NEW
        const billToContPerson = billToContactPerson.value.trim(); // NEW
        const billToContNumber = billToContactNumber.value.trim(); // NEW: Contact Number

        let shipToCustName = ''; // NEW
        let shipToShipAddress = ''; // NEW
        let shipToContPerson = ''; // NEW

        if (sameAsBillingCheckbox.checked) {
            shipToCustName = billToCustName;
            shipToShipAddress = billToCustAddress;
            shipToContPerson = billToContPerson;
        } else {
            shipToCustName = shipToCustomerName.value.trim();
            shipToShipAddress = shipToShippingAddress.value.trim();
            shipToContPerson = shipToContactPerson.value.trim();
        }

        const placeOfSupply = placeOfSupplyInput.value.trim(); // NEW
        const salesperson = salespersonInput.value.trim(); // NEW

        const quoteDateStr = quoteDateInput.value;

        if (!billToCustName || !billToCustAddress || !billToContPerson || !subject || !placeOfSupply || !salesperson || !quoteDateStr || !shipToCustName || !shipToShipAddress || !shipToContPerson) {
            alert('Please fill in all required fields (Bill To, Ship To, Subject, Place of Supply, Salesperson, Quote Date).');
            return;
        }

        const items = [];
        let subTotal = 0; // This will be the subtotal AFTER per-item discounts

        const itemRows = itemsContainer.querySelectorAll('.item-row');
        itemRows.forEach((row, index) => {
            const sku = row.querySelector('.sku-input').value;
            const qty = parseInt(row.querySelector('.qty-input').value);
            const discountPerItem = parseFloat(row.querySelector('.discount-per-item-input').value) || 0; // NEW
            const component = masterComponents.find(c => c.sku.toLowerCase() === sku.toLowerCase());

            if (component && qty > 0) {
                const rate = component.rate;
                const netRate = rate * (1 - discountPerItem / 100);
                const itemAmount = qty * netRate;
                const itemDiscountAmount = (qty * rate) - itemAmount; // Actual discount amount for this item

                subTotal += itemAmount; // Add net amount to subtotal
                items.push({
                    id: index + 1,
                    sku: sku,
                    description: component.description,
                    qty: qty,
                    rate: rate, // Original rate
                    discountPercent: discountPerItem, // Percentage for display if needed
                    discountAmount: itemDiscountAmount, // Actual discount value
                    netAmountPerUnit: netRate, // Rate after discount, per unit
                    amount: itemAmount // Total amount for this line item (qty * netRate)
                });
            }
        });

        if (items.length === 0) {
            alert('Please add at least one valid item to the quote.');
            return;
        }

        const gstAmount = subTotal * 0.18; // 18% GST on the subtotal (after item discounts)
        const totalAmount = subTotal + gstAmount;

        const quoteDate = new Date(quoteDateStr);
        const expiryDate = new Date(quoteDate);
        expiryDate.setDate(quoteDate.getDate() + 30);

        const formattedQuoteDate = quoteDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedExpiryDate = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const randomQuoteSuffix = generateRandomQuoteSuffix();
        const finalQuoteNumber = `NIIPL/24-25/QT${randomQuoteSuffix}`;

        // --- Construct the HTML for the quote ---
        let itemsHtml = '';
        items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.sku}</td>
                    <td>${item.description}</td>
                    <td class="text-right">${item.qty}</td>
                    <td class="text-right">${item.rate.toFixed(2)}</td>
                    <td class="text-right">${item.discountAmount.toFixed(2)}</td> 
                    <td class="text-right">${item.amount.toFixed(2)}</td>
                </tr>
            `;
        });

        // NEW: Embedded CSS updated for new layout and robustness
        const embeddedCss = `body{
        .container {
            max-width: 1200px;
      margin: 0 auto;
      padding: 0px;
      border: 1px solid #1b1b1b;
      font-family: Arial, sans-serif;};
         } 
      *{
         box-sizing: unset;}

    {
        
        font-size: 8px;
        margin: 0px, auto;
        border: 1px solid #1b1b1b;
        padding: 10px;
        width: 800px;
    }
    table {
        width: 100%;
        border-collapse: collapse;

    }
    .header-table td {
        padding: 10px;
        vertical-align: top;
    }
    .terms-conditions{
    padding:10px
    }
    .header-table{
        border-bottom: solid 1px #1b1b1b;
    }
    
    .header-left {
        /* Use flexbox to align logo and company details horizontally */
        display: flex;
    align-items: center; /* Vertically align items in the middle */
      border-right:1px solid #1b1b1b;

    }

      .header-right{
      display: flex;
    flex: 1 1 auto;
    justify-content: end;
    align-items: flex-end;
      }

      .header-table tr:nth-child(3) td{
      line-height: 5px;
      vertical-align: middle;
      }

    .main-header{
        display: flex;
    }
    .main-header > td{
        padding: 5px;
    }

    .logo {
        width: 150px; /* Adjust as needed */
        margin-right: 10px; /* Space between logo and text */
        flex-shrink: 0; /* Prevent logo from shrinking */

    }
    .company-details {
        /* No need for inline-block or vertical-align here due to flexbox */
        flex-grow: 1; /* Allow company details to take up remaining space */
    }
    .quote-title {
        font-size: 24px;
        font-weight: bold;
        color: #333;
        margin-bottom: 5px;
    }
    .section-titles {
        background-color: #eaeaea;
        padding: 5px;
        font-weight: bold;
        margin-top: 10px;
        margin-bottom: 5px;
    }
    .Upper-table td {
        padding: 5px;
        text-align: left;
        width:25%
    }
    .table-titles {
        background-color: #f2f2f2;
        border-bottom: 1px solid #1b1b1b;
        border-top: 1px solid #1b1b1b;
        }
    .Lower-table td {
        padding: 5px;
        border: 1px solid #1b1b1b;
        text-align: left;
    }
    .item-table th, .item-table td {
        border: 1px solid #1b1b1b;
        padding: 5px;
        vertical-align: top;
    }
    .item-table th {
        background-color: #f9f9f9;
        font-weight: bold;
        text-align: left;
    }
    .item-table .description {
        width: 50%;
    }
    .item-table .hsn {
        width: 10%;
    }
    .item-table .rate, .item-table .Discount, .item-table .Amount {
        width: 8%;
    }
    .serial-number{
        width: 6%;
        }
    .item-sku {
        width: 10%;
    }
    .totals-tables {
        float: right;
        width: 30%;
        margin-top: 10px;
    }
        .logo{
         display: flex;
        justify-content: center;
        align-items: center;
        height: 100px;
        }

    .totals-tables td {
        padding: 3px;
        text-align: right;
        border:1px solid #1b1b1b;
    }
    .totals-tables .label {
        text-align: left;
        font-weight: bold;
    }
   .subtotal-row td:nth-child(2),
.subtotal-row td:nth-child(3),
.gst-row td:nth-child(2),
.gst-row td:nth-child(3),
.total-row td:nth-child(2),
.total-row td:nth-child(3) {
    text-align: right;
    font-style: italic
}
.Upper-table tr td:nth-child(2){
    border-right: 1px solid #1b1b1b;
    background-color: lightred
    }

   .total-row td:nth-child(1) {
    border: 0}
    .total-row {
        font-weight: bold;
        border-top: 1px solid #1b1b1b;
    }
    .terms-conditions {
        margin-top: 20px;
        border-top: 1px solid #1b1b1b;
        padding-top: 10px;
    }
    .terms-conditions ol {
        list-style-type: decimal;
        padding-left: 20px;
        margin-top: 5px;
    }
    .terms-conditions li {
        margin-bottom: 3px;
    }
    .footer-note {
        margin-top: 10px;
        font-style: italic;
    }
    .signature-area {
        margin-top: 30px;
        text-align: right;
    }
    .signature-line {
        border-top: 1px solid #000;
        width: 200px;
        display: inline-block;
        margin-top: 5px;
    }
    .float-left {
        float: left;
    }
    .float-right {
        float: right;
    }
    .clearfix::after {
        content: "";
        clear: both;
        display: table;
    }
    .header-table tr td:nth-child(3) {
        line-height:5px;
        padding-right:10px;
        vertical-align:middle;
        text-align:right
    }


    // Print styles
//     @media print{
//    td{
//         font-size: 12px;}
//         .item-table thead{
//         font-size: 12px;
//         }
//     .header-table tr td:nth-child(3)  {
//         line-height:20px;
//         background:black;
//     }    
    
    }
    
    `;


        const quoteHtml = `
             <!DOCTYPE html>
<html>
<head>
<title>Quotation from ${selectedFirm.name} to ${billToCustName}</title>
<style>${embeddedCss}</style>
<meta name="viewport" content="width=1024, initial-scale=1.0, user-scalable=no">

</head>
<body>
    <div class="container">
    <table class="header-table">
        <tr>
            <td class="logo"><img width="150px" src="${selectedFirm.logo}"</td>
            <td>
                <strong>${selectedFirm.name}</strong>,<br>
                ${selectedFirm.address}<br>
                GSTIN - ${selectedFirm.gstin}<br>
                E-Mail - ${selectedFirm.email}<br>
                Tel: ${selectedFirm.tel}
            </td>
            <td style=" " ><h2>Quote</h2><br>${finalQuoteNumber}</td>
        </tr>
    </table>
   
    <table class="Upper-table">
        <tr>
            <td><strong>Date:</strong></td>
            <td>${formattedQuoteDate}</td>
            <td><strong>Place of supply:</strong></td>
            <td>${placeOfSupply}</td>
        </tr>
        <tr>
            <td><strong>Expiry Date:</strong></td>
            <td>${formattedExpiryDate}</td>
            <td><strong>Salesperson</strong></td>
            <td>${salesperson}</td>
        </tr>
        <tr>
          
             
        </tr>
        <tr class="table-titles">
            <td colspan="2"><strong>Bill To:</strong></td>
            <td colspan="2"><strong>Customer:</strong></td>
        </tr>
        <tr>
            <td><strong>Customer</strong></td>
            <td>${billToCustName}</td>
            <td><strong>Ship to:</strong></td>
            <td>${shipToCustName}</td>
        </tr>
        <tr>
            <td><strong>Address</strong></td>
            <td>${billToCustAddress}</td>   
            <td><strong>Address</strong></td>
            <td>${shipToShipAddress}</td>
        </tr>
        <tr>
            <td><strong>Contact Person</strong></td>
            <td>${billToContPerson}</td>
            <td><strong>Contact Person</strong></td>
            <td>${shipToContPerson}</td>
        </tr>
        <tr>
            <td><strong>Contact Number</strong></td>
            <td>${billToContNumber}</td>
            <td><strong>Contact Number</strong></td>
            <td>${shipToContactNumber.value || '(Not Provided)'}</td>
        </tr>
        <tr class="table-titles">
            <td colspan="4"><strong>Subject</strong></td>
        </tr>
         <tr>
            <td colspan="4">${subject}</td>
        </tr>
        <tr></tr>
    </table>


    <table class="item-table" style="margin-top: 10px;">
        <thead>
            <tr>
                <th class="serial-number">Sr. No.</th>
                <th class="item-sku">SKU</th>
                <th class="description"> Item & Description</th>
                <th class="hsn">Qty</th>
                <th class="rate">Rate</th>
                <th class="Discount">Discount</th>
                <th class="amount">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${itemsHtml}
            <tr class="subtotal-row">
                <td colspan="3" >Total in Words : </td>
                <td class="label" colspan="2">Sub Total</td>
                <td colspan="2">Rs.${subTotal.toFixed(2)}</td>
            </tr>
            
            <tr class="gst-row">
                <td colspan="3"> ${numberToWords(Math.round(totalAmount))}</td>
                <td colspan="2" class="label">GST (18%)</td>
                <td colspan="2">Rs.${gstAmount.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
                <td colspan="3"></td>
                <td colspan="2" class="label">Total</td>
                <td colspan="2">Rs.${totalAmount.toFixed(2)}</td>
            </tr>
            <tr>
        <td colspan="7" class="terms-conditions">
        <h4>Terms & Conditions :</h4>
         <ol>
            <li>Kindly issue a formal Work/Purchase Order in the name of ${selectedFirm.name}<br> ${selectedFirm.address}<br> GSTIN - ${selectedFirm.gstin} With the acceptance of this quotation</li>
            <li>Loading & Unloading/Movement and shifting of material at the site is in your scope only.</li>
            <li>Transportation charges extra mentioned in quote (delivery from Jaipur)</li>
            <li>Payment terms - 100%advance along with purchase order.</li>
            <li>Taxes extra on the above price according to the prevailing GST Module (@18%).</li>
            <li>Delivery of the material in 4-5 days against the payment and purchase order.</li>
        </ol>
        </td>
    </tr>
        </tbody>
    </table>

    <div class="clearfix"></div>

</body>
</html>
        `;

        // Open in a new window/tab and trigger print
        const newWindow = window.open();
        newWindow.document.write(quoteHtml);
        newWindow.document.close(); // Important for some browsers to finish loading the content
        
        // Use a slight delay or onload event in the new window for more reliable printing
        // DOMContentLoaded is often enough if all CSS is embedded
        newWindow.document.addEventListener('DOMContentLoaded', () => {
            newWindow.focus(); // Focus on the new window
            newWindow.print(); // Trigger the browser's print dialog
        });
    }

    // Initial item row, toggle Ship To, and summary update
    // Call toggleShipToFields to set initial state based on checkbox
    toggleShipToFields();
});