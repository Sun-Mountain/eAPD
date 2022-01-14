/* eslint-disable no-cond-assign */
const error = 'missing-text-error';
const alert = 'missing-text-alert';

export const findAncestor = (e) => {
  // eslint-disable-next-line no-param-reassign
  while ((e = e.parentNode) && !e.classList.contains('form-and-review-list--item__expanded'));
  return e;
}

export const disableBtn = (e) => {
  const container = findAncestor(e);
  const doneBtn = container.querySelector('#form-and-review-list--done-btn');

  if (container
        .querySelectorAll(`.${error}`)
        .length > 0) {
          doneBtn.disabled = true;
        } else {
          doneBtn.disabled = false;
        }
};

export const addMissingTextAlert = (e, p, n) => {
  const lastDiv = p.lastChild;
  const div = document.createElement('div');
  const vowels = ("aeiouAEIOU");

  if (vowels.indexOf(n[0]) !== -1) {
    div.innerHTML = `Provide an ${n}`;
  } else {
    div.innerHTML = `Provide a ${n}`;
  }

  if (!lastDiv.classList.contains(error)) {
    div.classList.add(error);
    e.classList.add(alert);
    p.appendChild(div);
  }

  disableBtn(e);
};

export const removeMissingTextAlert = (e, p) => {
  const lastDiv = p.lastChild;
  console.log('BOOM')
  if(lastDiv.classList.contains(error)) {
    e.classList.remove(alert);
    lastDiv.classList.remove(error);
    p.removeChild(lastDiv);
  }

  disableBtn(e);
};

export const validateText = (e) => {
  const el = e.currentTarget
  const elName = el.name;
  const parent = el.parentNode;
  const text = el.innerHTML.trim();
  const elValue = el.value;

  return text || elValue === '' ? addMissingTextAlert(el, parent, elName) : removeMissingTextAlert(el, parent);
};