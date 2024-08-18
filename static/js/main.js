function updateModal(title, cancelBtn, postBtn) {
  $('#general_modal .modal-title').text(title);
  $('#general_modal button[data-bs-dismiss]').text(cancelBtn);
  $('#general_modal .btn-primary').text(postBtn);
  $('#general_modal').modal('show');
}

/*=============================================
=                 Action Menu                 =
=============================================*/

const createPostBtn = document.getElementById('create_post_btn');
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

$('a[data-action="delete"]').on('click', function (e) {
  e.preventDefault();
  const url = `delete-post/${$(this).attr('data-post')}`;
  updateModal('Delete Post', 'Cancel', 'Delete');
  $('#general_modal .btn-primary')
    .addClass('btn-danger')
    .on('click', () => {
      $('#general_modal').modal('hide');
      $.ajax({
        type: 'POST',
        url: url,
        data: $('#delete_post_form').serialize(),
        beforeSend: () => {
          $('#general_modal #loader').show();
        },
        success: () => {
          $('#general_modal #loader').hide();
        },
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
      $('#general_modal #loader').show();
    },
    success: (data) => {
      $('#general_modal #loader').hide();
      $('#general_modal .modal-body').html(data);
    },
  });
});
