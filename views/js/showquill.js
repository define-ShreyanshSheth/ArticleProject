

function showquill(data , editors){
    // let editors = document.getElementsByClassName('quilldata');
    // let data = document.getElementsByClassName('data')
        let length = editors.length;
        for(let i = 0 ; i<length ; i++) {
               let text = data[i].innerHTML;
                let quill = new Quill(editors[i] ,  { modules: {toolbar:false}, theme: 'snow'});
                quill.setContents(JSON.parse(text));
                quill.disable();
        }
}