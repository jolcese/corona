
export function createInput(container, type, id, value, label ) {
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
  container.appendChild(document.createElement("br"));

  return input;
}