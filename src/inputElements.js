import noUiSlider from 'nouislider';

export function createInput(container, type, id, value, label, addBreak) {
  var input = document.createElement('input'); 
  input.type = type; 
  input.name = id; 

  if (type == 'value') input.value = value; 
  if (type == 'checkbox') input.checked = value; 

  input.id = id; 

  var inputLabel = document.createElement('label'); 
  inputLabel.htmlFor = "id"; 
  inputLabel.appendChild(document.createTextNode(label)); 

  container.appendChild(inputLabel); 
  container.appendChild(input); 
  if (addBreak) container.appendChild(document.createElement("br"));

  return input;
}

export function createInputSlider(container, id, options ) {

  const inputSliderContainer = document.createElement('div');
  inputSliderContainer.className = 'sliderspacing';
  container.appendChild(inputSliderContainer);

  const inputSlider = document.createElement('div');
  inputSlider.id = id;
  inputSliderContainer.appendChild(inputSlider)

  noUiSlider.create(inputSlider, options);

  return inputSlider
}

