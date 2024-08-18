/*=============================================
=                 Action Menu                 =
=============================================*/

const createPostBtn = document.getElementById('create_post_btn');
$('#create_post_btn').on('click', () => {
  $('#general_modal .modal-title').text('Create Post');
  $('#general_modal button[data-bs-dismiss]').text('Cancel');
  $('#general_modal .btn-primary')
    // @TODO: add error handling
    .text('Post')
    .on('click', () => {
      $('#general_modal').modal('hide');
      $.post('create-post', $('#create_post_form').serialize());
      // @TODO: if user is already on posts page, insert post instead of reloading
      window.location.replace('');
    });
  $.get('create-post', (data, status) => {
    $('#general_modal .modal-body').html(data);
    // @TODO: Handle errors
  });
});
