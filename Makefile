sources = csv/economy.csv csv/environment.csv csv/industry.csv csv/population.csv

all: $(sources) csv/sa2_2011.csv

csv/economy.csv: sources/National\ Regional\ Profile\,\ Economy\,\ ASGS\,\ 2007\-2011.csv
	sed \
		-e 's/Geography - Codes/region_id/' \
		-e 's/Geography - Labels/region_name/'  \
		-e 's/Year - Labels/year/' \
		"$<" > $@

csv/environment.csv: sources/National\ Regional\ Profile\,\ Environment\,\ ASGS\,\ 2007\-2011.csv
	sed \
		-e 's/Geography - Codes/region_id/' \
		-e 's/Geography - Labels/region_name/'  \
		-e 's/Year - Labels/year/' \
		"$<" > $@

csv/industry.csv: sources/National\ Regional\ Profile\,\ Industry\,\ ASGS\,\ 2007\-2011.csv
	sed \
		-e 's/Geography - Codes/region_id/' \
		-e 's/Geography - Labels/region_name/'  \
		-e 's/Calendar Year - Labels/year/' \
		"$<" > $@

csv/population.csv: sources/National\ Regional\ Profile\,\ Population\,\ ASGS\,\ 2007\-2011.csv
	sed \
		-e 's/Regional Code - Codes/region_id/' \
		-e 's/Regional Code - Labels/region_name/'  \
		-e 's/At 30 June - Labels/year/' \
		"$<" > $@

csv/sa2_2011.csv: $(sources)
	node nrp --year 2011 -o $@ -- $^

clean:
	rm csv/*
