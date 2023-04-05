alias_ssh=cadastre_prod
depts=$(curl https://cadastre.data.gouv.fr/data/dgfip-pci-image/2021-02-01/tiff/departements/ | grep -o dep[0-9][0-9] | sed 's#dep##g' | sort | uniq)

true >| localisants_2021.txt

for i in $depts;
  do  echo ftp://Parcel_Expr_PCI_BETA_ext:ahf7jooNg2thaiSh@ftp3.ign.fr/PCI-par-DEPT_2021-10/PARCELLAIRE_EXPRESS_1-0__SHP_LAMB93_D0${i}_2021-10-01.7z >> localisants_2021.txt;
done;

wget --continue -i localisants_2021.txt
unp PARCELLAIRE_EXPRESS_1-0__SHP_LAMB93_D0*.7z;

for i in $(find PARCELLAIRE_EXPRESS_1-0__SHP_LAMB93_D0*/ -iname 'LOCALISANT.SHP');
  do dep=$(echo "$i" | grep -o "D0[0-9][0-9]" | uniq | sed 's#D0##g');
     ogr2ogr -f GeoJSON "localisants-${dep}.geojson" $i;
     gzip "localisants-${dep}.geojson"
done;

scp localisants-*.gz $alias_ssh:/srv/cadastre-data/ign-localisants/2021-10-01/geojson/
