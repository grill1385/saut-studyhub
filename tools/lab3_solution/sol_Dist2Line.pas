procedure Dist2Line(xi,yi,xf,yf,xr,yr: double; var kl, pix, piy: double);
var
  ux, uy: double;
begin
  ux := (xf - xi)/sqrt(sqr(xf - xi) + sqr(yf - yi));
  uy := (yf - yi)/sqrt(sqr(xf - xi) + sqr(yf - yi));
  kl := (xr*uy - yr*ux - xi*uy + yi*ux)/(sqr(ux) + sqr(uy));
  pix := -kl*uy + xr;
  piy := kl*ux + yr;
end;