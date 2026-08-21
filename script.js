const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('nav');
menuButton.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', isOpen);
});
document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => navigation.classList.remove('open')));
document.querySelector('#enquiry-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const details = new FormData(form);
  const subject = 'SHIMORA class enquiry';
  const message = `Name: ${details.get('name')}\nEmail: ${details.get('email')}\nInterested in: ${details.get('class')}`;
  window.location.href = `mailto:shimora32@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  form.querySelector('.form-message').textContent = 'Your email app is opening with your enquiry details.';
  form.reset();
});
document.querySelector('.upi').addEventListener('click', event => {
  const button = event.currentTarget;
  navigator.clipboard.writeText(button.dataset.upi).then(() => {
    button.querySelector('small').textContent = `UPI ID copied: ${button.dataset.upi}`;
  });
});
const weeklyBasicPlan = document.querySelector('.basic-tier .tier-plan');
weeklyBasicPlan.querySelector('strong').innerHTML = '₹2,000 <small>/ week</small>';
weeklyBasicPlan.querySelector('p').textContent = '3 sessions per month';
