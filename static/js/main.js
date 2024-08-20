import {
  computePosition,
  flip,
  shift,
  offset,
  autoUpdate,
} from 'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.6.10/+esm';

// make the token available to ajax
const csrftoken = Cookies.get('csrftoken');

const loader = `<div class="spinner-grow text-primary" role="status">
  <span class="sr-only">Loading...</span>
</div>`;

function updateModal(title, cancelBtn, postBtn) {
  $('#general_modal .modal-title').text(title);
  $('#general_modal .btn-secondary').text(cancelBtn);
  $('#general_modal .btn-primary').text(postBtn);
  $('#general_modal').modal('show');
}

/*=============================================
=                 Action Menu                 =
=============================================*/

$('#create_post_btn').on('click', () => {
  updateModal('Create Post', 'Cancel', 'Post');
  $('#general_modal .btn-primary').on('click', () => {
    $('#general_modal').modal('hide');
    $.post('create-post', $('#create_post_form').serialize()).done(() => {
      window.location.replace('');
    });
    // @TODO: if user is already on posts page, insert post instead of reloading
  });
  $.get('create-post', (data, status) => {
    $('#general_modal .modal-body').html(data);
    // @TODO: Handle errors
  });
});

/*=============================================
=              Action Menu Posts              =
=============================================*/

$('button[data-action="delete"]').on('click', function (e) {
  e.preventDefault();
  const url = `/delete-post/${$(this).attr('data-post')}`;
  updateModal('Delete Post', 'Cancel', 'Delete');
  $('#general_modal .btn-primary')
    .addClass('btn-danger')
    .on('click', () => {
      $('#general_modal').modal('hide');
      $.ajax({
        type: 'POST',
        url: url,
        data: $('#delete_post_form').serialize(),
      }).done(() => {
        // @TODO: just remove the deleted post, instead of reloading
        window.location.replace('');
      });
    });
  $.ajax({
    type: 'GET',
    url: url,
    data: $('#delete_post_form').serialize(),
    beforeSend: () => {
      $('#general_modal .modal-body').html(loader);
    },
    success: (data) => {
      $('#general_modal .modal-body').html(data);
    },
  });
});

/*=============================================
=              Add to Collection              =
=============================================*/
function buttonAction() {
  const menu = $(this).next()[0];
  const btn = this;
  let populated = false;
  $(menu).show().html(loader);

  // Positioning logic from FloatingUI, https://floating-ui.com/docs/tutorial
  const cleanup = autoUpdate(btn, menu, () => {
    computePosition(btn, menu, {
      placement: 'bottom',
      middleware: [offset(0), flip(), shift()],
    }).then(({ x, y }) => {
      Object.assign(menu.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  });

  // Hide if clicked away
  $(document).on('click', function (event) {
    if (!(menu.contains(event.target) || btn.contains(event.target))) {
      if (populated) {
        const data = $(menu).find('.collection-list').serialize();
        $(menu).html(loader);
        $(btn).off('click');
        $.ajax({
          type: 'POST',
          url: `collection-menu/${$(btn).attr('data-post')}`,
          headers: {
            'X-CSRFToken': csrftoken,
          },
          mode: 'same-origin',
          data: data ? data : $.param({ collection: 'empty' }, true),
          success: () => {
            $(menu).hide();
            cleanup();
            $(btn).on('click', buttonAction);
          },
          // @TODO: handle errors, show result in toast
        });
        populated = false;
      }
      $(document).off('click');
      return;
    }
  });

  $.ajax({
    type: 'GET',
    url: `collection-menu/${$(btn).attr('data-post')}`,
    success: (data) => {
      let htmlOut = '<form class="collection-list"><ul class="list-group">';
      const { response } = data;
      for (const collection of response)
        htmlOut += `<li class="list-group-item d-flex justify-content-between">
<input type="checkbox" class="btn-check" id="col-${
          collection.id
        }" autocomplete="off" value="${
          collection.id
        }" aria-label="add post to ${collection.name}" ${
          collection.checked ? 'checked' : ''
        } name="collection">
<label class="btn btn-primary w-100 text-center" for="col-${collection.id}">${
          collection.name
        }</label>
    </li>`;
      htmlOut += `</ul></form>
  <form class="add-collection">
    <button type="button" class="btn btn-primary w-100 mt-2" aria-label="create new Collection">
      <i class="fas fa-plus"></i>
    </button>
              <input class="form-control mt-2" type="text"
              placeholder="New Collection Name" aria-label="Enter new
              Collection name and press enter to create" required>
  </form>
      `;
      $(menu).html(htmlOut).find('.add-collection input').hide();

      /*----------  Add collection logic  ----------*/
      $(menu)
        .find('.add-collection')
        .find('button')
        .on('click', function () {
          $(this).hide();
          $('.add-collection').find('input').show().focus();
          $('.add-collection').on('submit', function (e) {
            e.preventDefault();
            const name = $(this).find('input').val();
            $.ajax({
              type: 'POST',
              url: '/create-collection',
              data: { name },
              headers: {
                'X-CSRFToken': csrftoken,
              },
              success: (collection) => {
                $(menu)
                  .find('.collection-list')
                  .append(
                    `
                  <li class="list-group-item d-flex justify-content-between">
<input type="checkbox" class="btn-check" id="col-${collection.id}" autocomplete="off" value="${collection.id}" aria-label="add post to ${collection.name}" name="collection" checked>
<label class="btn btn-primary w-100 text-center" for="col-${collection.id}">${collection.name}</label>
    </li>
`
                  );
                $(menu)
                  .find('.add-collection input')
                  .hide()
                  .parent()
                  .find('button')
                  .show();
              },
            });
          });
        });
      populated = true;
    },
  });
}

$('button[data-action="add_to_collection"]').on('click', buttonAction);

/*=============================================
=              Delete Collection              =
=============================================*/
$('button[data-action="delete-collection"]').on('click', function (e) {
  e.preventDefault();
  const url = `/delete-collection/${$(this).attr('data-post')}`;
  updateModal('Delete Collection', 'Cancel', 'Delete');
  $('#general_modal .btn-primary')
    .addClass('btn-danger')
    .on('click', () => {
      $('#general_modal').modal('hide');
      $.ajax({
        type: 'POST',
        url: url,
        data: $('#delete_collection_form').serialize(),
      }).done(() => {
        // @TODO: just remove the deleted post, instead of reloading
        window.location.replace('');
      });
    });
  $.ajax({
    type: 'GET',
    url: url,
    data: $('#delete_post_form').serialize(),
    beforeSend: () => {
      $('#general_modal .modal-body').html(loader);
    },
    success: (data) => {
      $('#general_modal .modal-body').html(data);
    },
  });
});
