procedure SimTwoFowardKinematics(var RC: TRobotControls);
var
  odo0, odo1, odo2, odo3: integer;
  delta_dwh0, delta_dwh1, delta_dwh2, delta_dwh3: double;
  delta_d, delta_dn, delta_th: double;
begin
  // Get impulses count
  odo0 := GetAxisOdo( RC.irobot , RC.iMot[0] );
  odo1 := GetAxisOdo( RC.irobot , RC.iMot[1] );
  odo2 := GetAxisOdo( RC.irobot , RC.iMot[2] );
  odo3 := GetAxisOdo( RC.irobot , RC.iMot[3] );
  // Wheels displacements
  delta_dwh0 := pi*Dnom*odo0/(ngear*Ce);
  delta_dwh1 := pi*Dnom*odo1/(ngear*Ce);
  delta_dwh2 := pi*Dnom*odo2/(ngear*Ce);
  delta_dwh3 := pi*Dnom*odo3/(ngear*Ce);
  // Linear and Angular displacements
  delta_d  := ( delta_dwh0 + delta_dwh1 + delta_dwh2 + delta_dwh3 ) / 4;  
  delta_dn := (-delta_dwh0 + delta_dwh1 + delta_dwh2 - delta_dwh3 ) / 4;
  delta_th := (-delta_dwh0 + delta_dwh1 - delta_dwh2 + delta_dwh3 ) / (2*(L1nom + L2nom));
  // Robot odometric pose
  if Abs(Deg(delta_th)) < 0.01 then begin
    xodo := xodo + delta_d*cos(thodo)-delta_dn*sin(thodo);
    yodo := yodo + delta_d*sin(thodo)+delta_dn*cos(thodo);
  end else begin
    xodo := xodo + (delta_d*sin(delta_th)+delta_dn*(cos(delta_th)-1))*cos(thodo+delta_th/2)/delta_th
                 - (delta_d*(1-cos(delta_th))+delta_dn*sin(delta_th))*sin(thodo+delta_th/2)/delta_th; 
    yodo := yodo + (delta_d*sin(delta_th)+delta_dn*(cos(delta_th)-1))*sin(thodo+delta_th/2)/delta_th
                 + (delta_d*(1-cos(delta_th))+delta_dn*sin(delta_th))*cos(thodo+delta_th/2)/delta_th;
  end;
  thodo := thodo + delta_th;

  // --------------------------------------------------
  // DEBUG
  // Robot pose
  SetRCValue(21,13,format('%.4g',[xodo]));
  SetRCValue(22,13,format('%.4g',[yodo]));
  SetRCValue(23,13,format('%.4g',[Deg(thodo)]));
  // Displacements  
  SetRCValue(21,15,format('%.4g',[delta_d]));
  SetRCValue(22,15,format('%.4g',[delta_dn]));
  SetRCValue(23,15,format('%.4g',[Deg(delta_th)]));
  SetRCValue(21,17,format('%.4g',[delta_dwh0]));
  SetRCValue(22,17,format('%.4g',[delta_dwh1]));
  SetRCValue(23,17,format('%.4g',[delta_dwh2]));
  SetRCValue(24,17,format('%.4g',[delta_dwh3]));
end;