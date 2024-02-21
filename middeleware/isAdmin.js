function isAdminAllowed(req, res, next) {
    sess = req.session;
    //console.log(sess);
    if (sess.user) {
          
          if(sess.user.role=="Admin"){
                return next();
          }else{
            res.redirect('/login');
          }
    }
    else { res.redirect('/login'); }
}


module.exports = isAdminAllowed;