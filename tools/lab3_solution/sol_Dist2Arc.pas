procedure Dist2Arc(xc, yc, R, xr, yr: double; var pix, piy: double);
var
  ux, uy: double;
begin
  ux := (xr - xc)/sqrt(sqr(xr - xc) + sqr(yr - yc));
  uy := (yr - yc)/sqrt(sqr(xr - xc) + sqr(yr - yc));
  pix := R * ux + xc;
  piy := R * uy + yc;
end;