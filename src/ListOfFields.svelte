<script>
  export let list = [];

  let olist = [];

  let nestooo;

  let position = 0;
  function add(l) {
      olist = olist.concat({ label: l, text: inputText(l), position: position});
      position += 1;
      
  }
  function inputText(l) {
      return '<input type="text" name="'+l+'" id="'+l+'">';
  }

  	function dragstart (ev, item) {
        ev.dataTransfer.setData("item", item);
       
	}
	function dragover (ev) {
		ev.preventDefault();
		ev.dataTransfer.dropEffect = 'move';
	}
	function drop (ev, m) {
		ev.preventDefault();
        var i = ev.dataTransfer.getData("item");
        var temp = olist[i].position;
        olist[i].position = olist[m].position;
        
        olist[m].position = temp;
        olist.sort((a,b) => a.position > b.position ? 1 : -1);
        nestooo = "";
        var tt = document.querySelectorAll("#wrap > div");
        tt.forEach(element => {
            nestooo += element.innerHTML;
        });
        console.log(nestooo)

    }
    
    $: olist = olist;
  
    $: console.log(olist);

</script>

<style>

</style>

<ul class="list-group">
{#each list as l}
<li class="list-group-item" on:click="{()=>add(l)}" id="{l}">{l}</li>
<input type="hidden">

{/each}
</ul>

<div id="wrap">
{#each olist as l,i}
<div draggable={true} on:dragstart="{event => dragstart(event, i)}" on:drop="{event => drop(event,i)}"
  on:dragover="{dragover}">
<label for="{l.label}" >{l.label}</label>
{@html l.text}

</div>
{/each}
</div>

<textarea name="" id="" cols="30" rows="10">{nestooo}</textarea>

