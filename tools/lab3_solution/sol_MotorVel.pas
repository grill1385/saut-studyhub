procedure MotorVel(V,Vn,W: double; var RC: TRobotControls);
var Vmax, VnMax, Wmax: double;
begin
  // Maximum velocities
  Vmax  := GetRCValue(14,6);
  VnMax := GetRCValue(15,6);
  Wmax  := GetRCValue(16,6);

   // Inverse Kinematics - positive rotation is clockwise for 1 and 3 wheels!!!
  RC.V[0] := V*Vmax - Vn*VnMax - (L1nom + L2nom)*W*Wmax/2;
  RC.V[1] := V*Vmax + Vn*VnMax + (L1nom + L2nom)*W*Wmax/2;
  RC.V[2] := V*Vmax + Vn*VnMax - (L1nom + L2nom)*W*Wmax/2;
  RC.V[3] := V*Vmax - Vn*VnMax + (L1nom + L2nom)*W*Wmax/2;
end;