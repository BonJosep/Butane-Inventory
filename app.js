// app.js — main logic

// Helpers
const q = id => document.getElementById(id);
const nowString = () => new Date().toLocaleString();

function safeFloat(val){
  if (val === undefined || val === null) return 0.0;
  const v = parseFloat(String(val).replace(/,/g, ''));
  return Number.isFinite(v) ? v : 0.0;
}
function safeInt(val){
  if (val === undefined || val === null) return 0;
  const v = parseInt(String(val).replace(/,/g, ''), 10);
  return Number.isFinite(v) ? v : 0;
}

// State
let calculationResults = {
  "Total sold": 0,
  "Refills sold": 0,
  "Brand New Butane sold": 0,
  "Refill Money to Remit": 0.0,
  "Brand New Money to Remit": 0.0,
  "Total Money to Remit": 0.0,
  "Total Expenses": 0.0,
  "Final Money to Remit": 0.0,
};

// Expenses stored as array of {name, amount}
let expenses = JSON.parse(localStorage.getItem('butane_expenses') || '[]');

// Load saved inputs (optional)
function loadInputs(){
  const saved = JSON.parse(localStorage.getItem('butane_inputs') || '{}');
  if(saved.refill_price) q('refill_price').value = saved.refill_price;
  if(saved.brand_new_price) q('brand_new_price').value = saved.brand_new_price;
  if(saved.stocks_out) q('stocks_out').value = saved.stocks_out;
  if(saved.back_out) q('back_out').value = saved.back_out;
  if(saved.remaining_items) q('remaining_items').value = saved.remaining_items;
  if(saved.empty_cans) q('empty_cans').value = saved.empty_cans;
}

function saveInputs(){
  const payload = {
    refill_price: q('refill_price').value,
    brand_new_price: q('brand_new_price').value,
    stocks_out: q('stocks_out').value,
    back_out: q('back_out').value,
    remaining_items: q('remaining_items').value,
    empty_cans: q('empty_cans').value,
  };
  localStorage.setItem('butane_inputs', JSON.stringify(payload));
}

function updateResultsDisplay(){
  const container = q('results_container');
  container.innerHTML = '';
  const order = [
    ['Total sold', true], ['Refills sold', true], ['Brand New Butane sold', true],
    ['Refill Money to Remit', false], ['Brand New Money to Remit', false], ['Total Money to Remit', false]
  ];

  order.forEach(([label, isInt]) => {
    const val = calculationResults[label] || 0;
    const text = isInt ? Number(val).toLocaleString() : Number(val).toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2});
    const node = document.createElement('div');
    node.className = 'results-item';
    node.innerHTML = `<div>${label}:</div><div>${text}</div>`;
    container.appendChild(node);
  });
}

function updateExpensesDisplay(){
  const list = q('expenses_list');
  list.innerHTML = '';
  if(!expenses.length){
    const p = document.createElement('div'); p.className='muted small'; p.textContent='No expenses added yet.'; list.appendChild(p); return;
  }
  expenses.forEach((ex, idx) => {
    const row = document.createElement('div'); row.className='results-item';
    row.innerHTML = `<div>${ex.name}</div><div>${Number(ex.amount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>`;
    // delete button
    const del = document.createElement('button'); del.textContent='✕'; del.title='Remove'; del.className='btn';
    del.style.marginLeft='8px'; del.onclick = ()=>{ expenses.splice(idx,1); persistExpenses(); updateExpensesDisplay(); };
    row.appendChild(del);
    list.appendChild(row);
  });
}

function persistExpenses(){
  localStorage.setItem('butane_expenses', JSON.stringify(expenses));
}

// Main calculation
function performCalculations(){
  saveInputs();
  const refill_price = safeFloat(q('refill_price').value);
  const brand_new_price = safeFloat(q('brand_new_price').value);
  const stocks_out = safeInt(q('stocks_out').value);
  const back_out = safeInt(q('back_out').value);
  const remaining_items = safeInt(q('remaining_items').value);
  const empty_cans = safeInt(q('empty_cans').value);

  const total_sold = stocks_out - back_out - remaining_items;
  const refills_sold = empty_cans;
  let brand_new_sold = total_sold - refills_sold;
  if(brand_new_sold < 0) brand_new_sold = 0; // guard

  const refill_money = refills_sold * refill_price;
  const brand_new_money = brand_new_sold * brand_new_price;
  const total_money_to_remit = refill_money + brand_new_money;

  calculationResults['Total sold'] = total_sold;
  calculationResults['Refills sold'] = refills_sold;
  calculationResults['Brand New Butane sold'] = brand_new_sold;
  calculationResults['Refill Money to Remit'] = refill_money;
  calculationResults['Brand New Money to Remit'] = brand_new_money;
  calculationResults['Total Money to Remit'] = total_money_to_remit;

  updateResultsDisplay();

  q('date_sales').textContent = 'Sales Calculated: ' + nowString();
  alert('Sales calculations updated!');
}

function addExpense(){
  const name = q('expense_name').value.trim();
  const amount = safeFloat(q('expense_amount').value);
  if(!name){ alert('Please enter an expense name.'); return; }
  if(amount <= 0){ alert('Please enter a valid amount greater than 0.'); return; }
  // If same name exists, add to it
  const existing = expenses.find(e => e.name.toLowerCase() === name.toLowerCase());
  if(existing){ existing.amount = Number(existing.amount) + amount; }
  else expenses.push({name, amount});
  persistExpenses();
  q('expense_name').value=''; q('expense_amount').value='';
  updateExpensesDisplay();
}

function performFinalCalculation(){
  const total_money_to_remit = calculationResults['Total Money to Remit'] || 0;
  const total_expenses = expenses.reduce((s,e)=>s+Number(e.amount),0);
  const final_money_to_remit = total_money_to_remit - total_expenses;

  calculationResults['Total Expenses'] = total_expenses;
  calculationResults['Final Money to Remit'] = final_money_to_remit;

  // render
  const finalEl = q('final_results'); finalEl.innerHTML='';
  const arr = [
    ['Total Money to Remit', false], ['Total Expenses', false], ['Final Money to Remit', false]
  ];
  arr.forEach(([label,isInt])=>{
    const val = calculationResults[label] || 0;
    const text = Number(val).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    const node = document.createElement('div'); node.className='results-item';
    node.innerHTML = `<div style="font-weight:${label==='Final Money to Remit'? '700':'400'}">${label}:</div><div style="font-weight:${label==='Final Money to Remit'? '700':'400'}">${text}</div>`;
    finalEl.appendChild(node);
  });

  q('date_final').textContent = 'Final Calculated: ' + nowString();
  alert('Final calculation completed!');
}

// Wire up UI
window.addEventListener('DOMContentLoaded', ()=>{
  loadInputs();
  updateResultsDisplay();
  updateExpensesDisplay();

  q('calculate_btn').addEventListener('click', performCalculations);
  q('add_expense_btn').addEventListener('click', addExpense);
  q('final_calc_btn').addEventListener('click', performFinalCalculation);

  // allow pressing enter on the expense amount
  q('expense_amount').addEventListener('keydown', (e)=>{ if(e.key==='Enter') addExpense(); });
});
