const destinationSelect = document.getElementById('destinationSelect');
const tourCards = Array.from(document.querySelectorAll('.tour-card'));
const noResults = document.getElementById('noResults');
const scheduleList = document.getElementById('scheduleList');
const scheduleForm = document.getElementById('scheduleForm');
const emptySchedules = document.getElementById('emptySchedules');
const scheduleDate = document.getElementById('scheduleDate');
const scheduleTime = document.getElementById('scheduleTime');
const scheduleTour = document.getElementById('scheduleTour');
const schedulePeople = document.getElementById('schedulePeople');
let nextScheduleId = 1;
const schedules = [];

// Tour slot updating 
tourCards.forEach(card => {
  const button = card.querySelector('.book-btn');
  const initialSlots = Number(button.dataset.slots || 0);
  card.dataset.baseSlots = String(initialSlots);
  card.dataset.remainingSlots = String(initialSlots);
  const title = card.querySelector('h3').textContent.trim();
  const option = document.createElement('option');
  option.value = title;
  option.textContent = `${title} — ${card.dataset.destination}`;
  scheduleTour.appendChild(option);
});

function cardForTour(tourName) {
  return tourCards.find(card => card.querySelector('h3').textContent.trim() === tourName);
}
function priceForTour(tourName) {
  const card = cardForTour(tourName);
  return card ? Number(card.querySelector('.book-btn').dataset.price || 0) : 0;
}
function remainingSlotsForTour(tourName) {
  const card = cardForTour(tourName);
  return card ? Number(card.dataset.remainingSlots || 0) : 0;
}
function refreshTourSlotDetails() {
  tourCards.forEach(card => {
    const remaining = Number(card.dataset.remainingSlots || 0);
    const destination = card.dataset.destination || '';
    const meta = card.querySelector('.tour-meta');
    meta.textContent = `${destination} · ${remaining} slots available`;
    card.querySelector('.book-btn').dataset.slots = String(remaining);
    card.querySelector('.book-btn').disabled = remaining < 1;
    card.querySelector('.book-btn').textContent = remaining < 1 ? 'Fully booked' : 'Book';
  });
}
function filterTours() {
  const destination = destinationSelect.value.trim().toLowerCase();
  let visible = 0;
  tourCards.forEach(card => {
    const cardDestination = (card.dataset.destination || '').trim().toLowerCase();
    const show = !destination || cardDestination === destination;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  noResults.style.display = visible ? 'none' : 'block';
}
document.getElementById('searchForm').addEventListener('submit', event => {
  event.preventDefault();
  filterTours();
  document.getElementById('tours').scrollIntoView({ behavior: 'smooth' });
});
document.querySelectorAll('.destination-card a[data-destination]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    destinationSelect.value = link.dataset.destination;
    filterTours();
    document.getElementById('tours').scrollIntoView({ behavior: 'smooth' });
  });
});

// A tour booking button opens the schedule form
tourCards.forEach(card => {
  card.querySelector('.book-btn').addEventListener('click', () => {
    const tour = card.querySelector('h3').textContent.trim();
    if (remainingSlotsForTour(tour) < 1) {
      alert("You're exceed the limit slot");
      return;
    }
    openScheduleForm(null, tour);
  });
});

function dateToInput(dateText) {
  if (!dateText) return '';
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function displayDate(dateString) {
  if (!dateString) return 'Date not set';
  return new Date(dateString + 'T12:00:00').toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' });
}
function displayTime(timeString) {
  if (!timeString) return 'Time not set';
  const [hours, minutes] = timeString.split(':').map(Number);
  const d = new Date(); d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}
function renderSchedules() {
  scheduleList.innerHTML = '';
  emptySchedules.style.display = schedules.length ? 'none' : 'block';
  schedules.forEach(item => {
    const article = document.createElement('article'); article.className = 'schedule-item';
    const main = document.createElement('div'); main.className = 'schedule-main';
    const title = document.createElement('h3'); title.textContent = item.tour;
    const card = cardForTour(item.tour);
    const destination = card?.dataset.destination || '';
    const details = document.createElement('p');
    details.textContent = `${destination} · ${displayDate(item.date)} · ${displayTime(item.time)} · ${item.people} traveler${item.people === 1 ? '' : 's'} · ₱${(priceForTour(item.tour) * item.people).toLocaleString('en-PH')} total`;
    main.append(title, details);
    const actions = document.createElement('div'); actions.className = 'schedule-actions';
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'btn btn-small'; edit.textContent = 'Edit';
    edit.addEventListener('click', () => openScheduleForm(item));
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn-small btn-danger'; remove.textContent = 'Delete';
    remove.addEventListener('click', () => {
      if (!confirm(`Delete the schedule for "${item.tour}"? The booked slots will be released.`)) return;
      const card = cardForTour(item.tour);
      if (card) card.dataset.remainingSlots = String(Number(card.dataset.remainingSlots) + item.people);
      const index = schedules.findIndex(s => s.id === item.id);
      if (index !== -1) schedules.splice(index, 1);
      refreshTourSlotDetails(); renderSchedules();
    });
    actions.append(edit, remove); article.append(main, actions); scheduleList.appendChild(article);
  });
}
function openScheduleForm(item = null, presetTour = '') {
  scheduleForm.hidden = false;
  document.getElementById('scheduleFormTitle').textContent = item ? 'Edit schedule' : 'Add a schedule';
  document.getElementById('scheduleId').value = item ? String(item.id) : '';
  scheduleTour.value = item?.tour || presetTour || '';
  scheduleDate.value = item?.date || '';
  scheduleTime.value = item?.time || '09:00';
  schedulePeople.value = item?.people ?? 1;
  document.getElementById('saveScheduleBtn').textContent = item ? 'Save changes' : 'Save schedule';
  scheduleForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  scheduleTour.focus();
}
document.getElementById('addScheduleBtn').addEventListener('click', () => openScheduleForm());
document.getElementById('cancelScheduleBtn').addEventListener('click', () => { scheduleForm.reset(); scheduleForm.hidden = true; });
scheduleForm.addEventListener('submit', event => {
  event.preventDefault();
  const idValue = document.getElementById('scheduleId').value;
  const tour = scheduleTour.value;
  const people = Number(schedulePeople.value);
  const date = scheduleDate.value;
  const time = scheduleTime.value;
  if (!tour || !Number.isInteger(people) || people < 1 || !date || !time) {
    alert('Choose a tour, enter a valid number of travelers, and select a date and departure time.'); return;
  }
  const existingIndex = idValue ? schedules.findIndex(item => item.id === Number(idValue)) : -1;
  const existing = existingIndex >= 0 ? schedules[existingIndex] : null;
  const oldTour = existing?.tour || '';
  const oldPeople = existing?.people || 0;
  const oldRemaining = remainingSlotsForTour(oldTour);
  const targetRemaining = remainingSlotsForTour(tour) + (oldTour === tour ? oldPeople : 0);
  if (people > targetRemaining) {
    alert("You're exceed the limit slot"); return;
  }
  
  
  
  if (existing && oldTour !== tour) {
    const oldCard = cardForTour(oldTour);
    if (oldCard) oldCard.dataset.remainingSlots = String(oldRemaining + oldPeople);
  }
  const targetCard = cardForTour(tour);
  if (targetCard) targetCard.dataset.remainingSlots = String(targetRemaining - people);
  const record = { id: existing ? existing.id : nextScheduleId++, tour, date, time, people };
  if (existingIndex >= 0) schedules[existingIndex] = record;
  else schedules.push(record);
  refreshTourSlotDetails(); renderSchedules();
  scheduleForm.reset(); scheduleForm.hidden = true;
});
refreshTourSlotDetails();
renderSchedules();
filterTours();
